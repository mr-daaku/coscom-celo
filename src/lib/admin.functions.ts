import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ADMIN_EMAIL } from "./plans";

/** Server-side gate: role row in the database AND the designated owner email. */
async function assertAdmin(context: { userId: string; supabase: any; claims: any }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  const email = String(context.claims?.email ?? "").toLowerCase();
  if (error || !isAdmin || email !== ADMIN_EMAIL) throw new Error("Forbidden");
}

export type MerchantDTO = {
  user_id: string;
  business_name: string | null;
  plan: string;
  plan_status: string;
  plan_expires_at: string | null;
  suspended: boolean;
  created_at: string;
  email?: string | null;
};

export type AdminWithdrawalDTO = {
  id: string;
  user_id: string;
  coin: string;
  chain: string;
  to_address: string;
  amount_usd: number;
  fee_usd: number;
  net_usd: number;
  status: string;
  created_at: string;
};

export type AdminPaymentDTO = {
  id: string;
  user_id: string;
  reference: string;
  amount_usd: number;
  fee_usd: number;
  coin: string;
  chain: string;
  crypto_amount: number | null;
  status: string;
  tx_hash: string | null;
  created_at: string;
};

export type PlanSettingsDTO = {
  plan: "free" | "cos" | "core";
  price_usd: number;
  fee_percent: number;
  withdraw_fee_percent: number;
  monthly_volume_usd: number;
  max_payment_usd: number;
  api_keys: number;
  min_withdraw_usd: number;
};

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const g = await import("./gateway.server");
    const client = await g.admin();

    const [{ data: payments }, { data: withdrawals }, { data: accounts }, { data: plans }] =
      await Promise.all([
        g
          .table(client, "payments")
          .select(
            "id, user_id, reference, amount_usd, fee_usd, coin, chain, crypto_amount, status, tx_hash, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        g.table(client, "withdrawals").select("id, user_id, coin, chain, to_address, amount_usd, fee_usd, net_usd, status, created_at").order("created_at", { ascending: false }).limit(200),
        g.table(client, "merchant_accounts").select("*").order("created_at", { ascending: false }).limit(200),
        g.table(client, "plan_payments").select("plan, price_usd, status, created_at").limit(2000),
      ]);

    const paid = ((payments as { amount_usd: number; fee_usd: number; status: string }[]) ?? []).filter(
      (p) => p.status === "paid",
    );
    const planPaid = ((plans as { price_usd: number; status: string }[]) ?? []).filter((p) => p.status === "paid");

    const { data: settings } = await g.table(client, "plan_settings").select("*").order("price_usd", {
      ascending: true,
    });

    // Merchant emails come from the Auth admin API; never expose anything else.
    const emails = new Map<string, string>();
    try {
      const { data: userPage } = await client.auth.admin.listUsers({ page: 1, perPage: 200 });
      for (const u of userPage?.users ?? []) if (u.email) emails.set(u.id, u.email);
    } catch {
      // email enrichment is best-effort
    }
    const withEmails = (((accounts as MerchantDTO[]) ?? []) as MerchantDTO[]).map((m) => ({
      ...m,
      email: emails.get(m.user_id) ?? null,
    }));

    return {
      totals: {
        merchants: ((accounts as unknown[]) ?? []).length,
        payments: ((payments as unknown[]) ?? []).length,
        settled: paid.length,
        volumeUsd: paid.reduce((s, p) => s + Number(p.amount_usd), 0),
        feeRevenueUsd: paid.reduce((s, p) => s + Number(p.fee_usd), 0),
        subscriptionRevenueUsd: planPaid.reduce((s, p) => s + Number(p.price_usd), 0),
        pendingWithdrawals: ((withdrawals as { status: string }[]) ?? []).filter((w) => w.status === "pending").length,
      },
      merchants: withEmails,
      withdrawals: (withdrawals as AdminWithdrawalDTO[]) ?? [],
      payments: (payments as AdminPaymentDTO[]) ?? [],
      planSettings: (settings as PlanSettingsDTO[]) ?? [],
    };
  });

export const adminUpdatePlanSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        plan: z.enum(["free", "cos", "core"]),
        price_usd: z.number().min(0).max(100_000),
        fee_percent: z.number().min(0).max(50),
        withdraw_fee_percent: z.number().min(0).max(50),
        monthly_volume_usd: z.number().min(0).max(1_000_000_000),
        max_payment_usd: z.number().min(1).max(100_000_000),
        api_keys: z.number().int().min(1).max(500),
        min_withdraw_usd: z.number().min(0).max(1_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const g = await import("./gateway.server");
    const client = await g.admin();
    const { plan, ...values } = data;
    const { error } = await g.table(client, "plan_settings").update(values).eq("plan", plan);
    if (error) throw new Error(error.message);
    g.invalidatePlanCache();
    return { ok: true };
  });

export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), suspended: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const g = await import("./gateway.server");
    const client = await g.admin();
    const { error } = await g
      .table(client, "merchant_accounts")
      .update({ suspended: data.suspended, updated_at: new Date().toISOString() })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ user_id: z.string().uuid(), plan: z.enum(["free", "cos", "core"]), months: z.number().int().min(0).max(24) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const g = await import("./gateway.server");
    const client = await g.admin();
    const expires = new Date();
    expires.setUTCMonth(expires.getUTCMonth() + (data.months || 1));
    const { error } = await g
      .table(client, "merchant_accounts")
      .update({
        plan: data.plan,
        plan_status: "active",
        plan_expires_at: data.plan === "free" ? null : expires.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "processing", "sent", "rejected"]),
        tx_hash: z.string().trim().max(128).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const g = await import("./gateway.server");
    const client = await g.admin();
    const { error } = await g
      .table(client, "withdrawals")
      .update({
        status: data.status,
        tx_hash: data.tx_hash ?? null,
        processed_at: data.status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertAdmin(context as never);
      return { admin: true };
    } catch {
      return { admin: false };
    }
  });
