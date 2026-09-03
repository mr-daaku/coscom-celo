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

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const g = await import("./gateway.server");
    const client = await g.admin();

    const [{ data: payments }, { data: withdrawals }, { data: accounts }, { data: plans }] =
      await Promise.all([
        g.table(client, "payments").select("amount_usd, fee_usd, status, created_at").limit(5000),
        g.table(client, "withdrawals").select("id, user_id, coin, chain, to_address, amount_usd, fee_usd, net_usd, status, created_at").order("created_at", { ascending: false }).limit(200),
        g.table(client, "merchant_accounts").select("*").order("created_at", { ascending: false }).limit(200),
        g.table(client, "plan_payments").select("plan, price_usd, status, created_at").limit(2000),
      ]);

    const paid = ((payments as { amount_usd: number; fee_usd: number; status: string }[]) ?? []).filter(
      (p) => p.status === "paid",
    );
    const planPaid = ((plans as { price_usd: number; status: string }[]) ?? []).filter((p) => p.status === "paid");

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
      merchants: (accounts as MerchantDTO[]) ?? [],
      withdrawals: (withdrawals as AdminWithdrawalDTO[]) ?? [],
    };
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
