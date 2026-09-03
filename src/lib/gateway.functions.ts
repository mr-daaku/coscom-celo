import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, type PlanId } from "./plans";

/** Chain label -> chain-checker id. Bitcoin is verified manually by an admin. */
const CHAIN_IDS: Record<string, string> = {
  Ethereum: "ethereum",
  BSC: "bsc",
  Polygon: "polygon",
  Base: "base",
  TRON: "tron",
  Solana: "solana",
  TON: "ton",
};

const address = z.string().trim().min(20).max(120);
const txHash = z
  .string()
  .trim()
  .min(20)
  .max(128)
  .regex(/^[A-Za-z0-9_:-]+$/, "Invalid transaction hash");
const reference = z
  .string()
  .trim()
  .regex(/^cos_[a-z0-9]{6,32}$/, "Invalid payment reference");


export type PaymentDTO = {
  id: string;
  reference: string;
  amount_usd: number;
  coin: string;
  chain: string;
  crypto_amount: number | null;
  deposit_address: string;
  fee_percent: number;
  fee_usd: number;
  net_usd: number;
  status: string;
  tx_hash: string | null;
  expires_at: string;
  description: string | null;
  created_at: string;
};

export type WithdrawalDTO = {
  id: string;
  coin: string;
  chain: string;
  to_address: string;
  amount_usd: number;
  fee_percent: number;
  fee_usd: number;
  net_usd: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
};

export type PlanOrderDTO = {
  id: string;
  plan: string;
  price_usd: number;
  coin: string;
  chain: string;
  deposit_address: string;
  status: string;
  expires_at: string;
};

export type PublicPaymentDTO = {
  reference: string;
  amount_usd: number;
  coin: string;
  chain: string;
  crypto_amount: number | null;
  deposit_address: string;
  status: string;
  expires_at: string;
  description: string | null;
  tx_hash: string | null;
};

/* ------------------------------- merchant ------------------------------- */

export const getMerchantOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const g = await import("./gateway.server");
    const account = await g.getAccount(context.userId);
    const plan = g.effectivePlan(account);
    const volumeUsd = await g.monthlyVolumeUsd(context.userId);
    const client = await g.admin();
    const { data: isAdmin } = await context.supabase.rpc("has_role" as never, {
      _user_id: context.userId,
      _role: "admin",
    } as never);
    const { data: paid } = await g
      .table(client, "payments")
      .select("amount_usd, fee_usd, net_usd, status")
      .eq("user_id", context.userId);
    const rows = ((paid as { amount_usd: number; fee_usd: number; net_usd: number; status: string }[]) ?? []);
    const settled = rows.filter((r) => r.status === "paid");
    const { data: withdrawn } = await g
      .table(client, "withdrawals")
      .select("net_usd, status")
      .eq("user_id", context.userId);
    const sent = ((withdrawn as { net_usd: number; status: string }[]) ?? []).filter(
      (w) => w.status !== "rejected",
    );

    const netSettled = settled.reduce((s, r) => s + Number(r.net_usd), 0);
    const withdrawnTotal = sent.reduce((s, r) => s + Number(r.net_usd), 0);

    return {
      account: {
        business_name: account.business_name,
        support_email: account.support_email,
        payout_address: account.payout_address,
        payout_chain: account.payout_chain,
        webhook_url: account.webhook_url,
        webhook_secret: account.webhook_secret,
        plan: account.plan,
        plan_status: account.plan_status,
        plan_expires_at: account.plan_expires_at,
        suspended: account.suspended,
      },
      plan,
      volumeUsd,
      isAdmin: Boolean(isAdmin),
      stats: {
        payments: rows.length,
        settled: settled.length,
        grossUsd: settled.reduce((s, r) => s + Number(r.amount_usd), 0),
        feesUsd: settled.reduce((s, r) => s + Number(r.fee_usd), 0),
        balanceUsd: Math.max(0, netSettled - withdrawnTotal),
      },
    };
  });

export const updateMerchantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        business_name: z.string().trim().max(80).optional(),
        support_email: z.string().trim().email().max(120).or(z.literal("")).optional(),
        payout_address: address.or(z.literal("")).optional(),
        payout_chain: z.string().trim().max(30).optional(),
        webhook_url: z.string().trim().url().startsWith("https://").max(300).or(z.literal("")).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const g = await import("./gateway.server");
    await g.getAccount(context.userId);
    const client = await g.admin();
    const patch = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? null : v]),
    );
    const { error } = await g
      .table(client, "merchant_accounts")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const rotateWebhookSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const g = await import("./gateway.server");
    const { randomBytes } = await import("crypto");
    const secret = randomBytes(24).toString("hex");
    const client = await g.admin();
    const { error } = await g
      .table(client, "merchant_accounts")
      .update({ webhook_secret: secret })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { webhook_secret: secret };
  });

const assetCode = z.string().trim().min(2).max(24);

export const createPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        amount_usd: z.number().positive().max(1_000_000),
        /** Asset code, e.g. BEP20-USDT, ERC20-USDT, TRX, BNB or ALL-CHAIN-COIN. */
        asset: assetCode.optional(),
        coin: z.string().trim().max(10).optional(),
        chain: z.string().trim().max(20).optional(),
        description: z.string().trim().max(200).optional(),
        customer_email: z.string().trim().email().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const g = await import("./gateway.server");
    return createPaymentRecord(g, context.userId, data);
  });

type CreateInput = {
  amount_usd: number;
  asset?: string | undefined;
  coin?: string | undefined;
  chain?: string | undefined;
  description?: string | undefined;
  customer_email?: string | undefined;
};

export async function createPaymentRecord(
  g: typeof import("./gateway.server"),
  userId: string,
  data: CreateInput,
): Promise<PaymentDTO> {
  const code = data.asset ?? (data.coin && data.chain ? g.assetCodeOf(data.coin, data.chain) : "");
  if (!code) {
    throw new Error(
      `Provide an asset code, e.g. "BEP20-USDT", "ERC20-USDT", "TRX", "BNB" or "${g.ALL_CHAIN_CODE}".`,
    );
  }
  const resolved = g.resolveAssetCode(code);

  const { account, plan } = await g.assertPaymentAllowed(userId, data.amount_usd);
  const feeUsd = Number(((data.amount_usd * plan.feePercent) / 100).toFixed(2));

  let coin = g.ANY_ASSET;
  let chain = g.ANY_ASSET;
  let cryptoAmount: number | null = null;
  let depositAddress = g.ANY_ADDRESS;

  if (resolved.kind === "asset") {
    const asset = g.assetFor(resolved.coin, resolved.chain);
    if (!asset) throw new Error(`Unsupported asset code: ${code}`);
    const price = await g.priceUsd(asset.cgId);
    coin = asset.coin;
    chain = asset.chain;
    cryptoAmount = Number((data.amount_usd / price).toFixed(asset.decimals));
    depositAddress = await g.depositAddress(userId, asset.chain);
  }

  const record = {
    user_id: userId,
    reference: g.newReference(),
    amount_usd: data.amount_usd,
    coin,
    chain,
    crypto_amount: cryptoAmount,
    deposit_address: depositAddress,
    fee_percent: plan.feePercent,
    fee_usd: feeUsd,
    net_usd: Number((data.amount_usd - feeUsd).toFixed(2)),
    status: "pending",
    description: data.description ?? null,
    customer_email: data.customer_email ?? null,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  const client = await g.admin();
  const { data: created, error } = await g.table(client, "payments").insert(record).select("*").single();
  if (error) throw new Error(error.message);
  await g.sendWebhook(account, "payment.created", created);
  return created as PaymentDTO;
}

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        amount_usd: z.number().positive().max(1_000_000),
        coin: z.string().trim().max(10),
        chain: z.string().trim().max(20),
        to_address: address,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const g = await import("./gateway.server");
    const account = await g.getAccount(context.userId);
    if (account.suspended) throw new Error("This account is suspended.");
    const plan = g.effectivePlan(account);
    if (!g.assetFor(data.coin, data.chain)) throw new Error("Unsupported coin/network pair.");
    if (data.amount_usd < plan.minWithdrawUsd) {
      throw new Error(`Minimum withdrawal on the ${plan.name} plan is $${plan.minWithdrawUsd}.`);
    }

    const overview = await getMerchantOverview();
    if (data.amount_usd > overview.stats.balanceUsd) {
      throw new Error("Withdrawal exceeds your available settled balance.");
    }

    const limited = await g.rateLimit(`withdraw:${context.userId}`, 5, 3600);
    if (!limited.allowed) throw new Error("Too many withdrawal requests. Try again later.");

    const feeUsd = Number(((data.amount_usd * plan.withdrawFeePercent) / 100).toFixed(2));
    const client = await g.admin();
    const { data: created, error } = await g
      .table(client, "withdrawals")
      .insert({
        user_id: context.userId,
        coin: data.coin.toUpperCase(),
        chain: data.chain,
        to_address: data.to_address,
        amount_usd: data.amount_usd,
        fee_percent: plan.withdrawFeePercent,
        fee_usd: feeUsd,
        net_usd: Number((data.amount_usd - feeUsd).toFixed(2)),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await g.sendWebhook(account, "withdrawal.requested", created);
    return created as WithdrawalDTO;
  });

/* --------------------------------- plans -------------------------------- */

export const startPlanCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan: z.enum(["cos", "core"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const g = await import("./gateway.server");
    const plan = PLANS[data.plan as PlanId];
    const asset = g.assetFor(g.PLAN_PAYMENT_ASSET.coin, g.PLAN_PAYMENT_ASSET.chain)!;
    const { DEPOSIT_ADDRESSES } = await import("./coscom");
    const limited = await g.rateLimit(`plan:${context.userId}`, 10, 3600);
    if (!limited.allowed) throw new Error("Too many checkout attempts. Try again later.");

    const client = await g.admin();
    const { data: created, error } = await g
      .table(client, "plan_payments")
      .insert({
        user_id: context.userId,
        plan: plan.id,
        price_usd: plan.priceUsd,
        coin: asset.coin,
        chain: asset.chain,
        deposit_address: DEPOSIT_ADDRESSES[asset.chain]!,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created as PlanOrderDTO;
  });

export const confirmPlanPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), tx_hash: txHash }).parse(input))
  .handler(async ({ data, context }) => {
    const g = await import("./gateway.server");
    const client = await g.admin();
    const limited = await g.rateLimit(`plantx:${context.userId}`, 20, 3600);
    if (!limited.allowed) throw new Error("Too many attempts. Try again later.");

    const { data: row } = await g
      .table(client, "plan_payments")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    const order = row as
      | { id: string; plan: PlanId; price_usd: number; coin: string; chain: string; deposit_address: string; status: string; expires_at: string }
      | null;
    if (!order) throw new Error("Order not found.");
    if (order.status === "paid") return { status: "paid" as const };
    if (new Date(order.expires_at) < new Date()) throw new Error("This order has expired. Start a new one.");

    const check = await verifyOnChain(order.chain, data.tx_hash, order.deposit_address, order.price_usd, order.coin);
    if (!check.ok) throw new Error(check.message);

    const expires = new Date();
    expires.setUTCMonth(expires.getUTCMonth() + 1);
    await g.table(client, "plan_payments").update({
      tx_hash: data.tx_hash,
      status: "paid",
      paid_at: new Date().toISOString(),
    }).eq("id", order.id);
    await g.table(client, "merchant_accounts").update({
      plan: order.plan,
      plan_status: "active",
      plan_expires_at: expires.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", context.userId);
    return { status: "paid" as const, plan: order.plan, plan_expires_at: expires.toISOString() };
  });

/* ------------------------------ public pay ------------------------------ */

export const getPaymentByReference = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ reference }).parse(input))
  .handler(async ({ data }) => {
    const g = await import("./gateway.server");
    const client = await g.admin();
    const { data: row } = await g
      .table(client, "payments")
      .select(
        "reference, amount_usd, coin, chain, crypto_amount, deposit_address, status, expires_at, description, tx_hash",
      )
      .eq("reference", data.reference)
      .maybeSingle();
    if (!row) throw new Error("Payment not found.");
    return row as PublicPaymentDTO;
  });

/** Supported asset codes, for checkout and dashboard pickers. */
export const listAssetCodes = createServerFn({ method: "GET" }).handler(async () => {
  const g = await import("./gateway.server");
  return { assets: g.ASSET_CODES, allChainCode: g.ALL_CHAIN_CODE, anyAsset: g.ANY_ASSET };
});

/** An all-chain invoice lets the payer bind the asset at checkout time. */
export const selectPaymentAsset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ reference, asset: z.string().trim().min(2).max(24) }).parse(input),
  )
  .handler(async ({ data }) => {
    const g = await import("./gateway.server");
    const client = await g.admin();
    const limited = await g.rateLimit(`payasset:${data.reference}`, 20, 600);
    if (!limited.allowed) throw new Error("Too many attempts. Try again shortly.");

    const { data: row } = await g
      .table(client, "payments")
      .select("id, user_id, amount_usd, coin, status, expires_at")
      .eq("reference", data.reference)
      .maybeSingle();
    const payment = row as
      | { id: string; user_id: string; amount_usd: number; coin: string; status: string; expires_at: string }
      | null;
    if (!payment) throw new Error("Payment not found.");
    if (payment.status !== "pending") throw new Error("This payment can no longer change asset.");
    if (new Date(payment.expires_at) < new Date()) throw new Error("This payment window has expired.");
    if (payment.coin !== g.ANY_ASSET) throw new Error("This invoice is already locked to one asset.");

    const resolved = g.resolveAssetCode(data.asset);
    if (resolved.kind === "any") throw new Error("Pick a specific coin and network.");
    const asset = g.assetFor(resolved.coin, resolved.chain);
    if (!asset) throw new Error("Unsupported asset.");

    const price = await g.priceUsd(asset.cgId);
    const { data: updated, error } = await g
      .table(client, "payments")
      .update({
        coin: asset.coin,
        chain: asset.chain,
        crypto_amount: Number((Number(payment.amount_usd) / price).toFixed(asset.decimals)),
        deposit_address: await g.depositAddress(payment.user_id, asset.chain),
      })
      .eq("id", payment.id)
      .select(
        "reference, amount_usd, coin, chain, crypto_amount, deposit_address, status, expires_at, description, tx_hash",
      )
      .single();
    if (error) throw new Error(error.message);
    return updated as PublicPaymentDTO;
  });

/** A payer submits their transaction hash; we verify it on-chain before settling. */
export const submitPaymentTx = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ reference, tx_hash: txHash }).parse(input))
  .handler(async ({ data }) => {
    const g = await import("./gateway.server");
    const client = await g.admin();
    const limited = await g.rateLimit(`paytx:${data.reference}`, 12, 600);
    if (!limited.allowed) throw new Error("Too many attempts for this payment. Try again shortly.");

    const { data: row } = await g.table(client, "payments").select("*").eq("reference", data.reference).maybeSingle();
    const payment = row as
      | {
          id: string;
          user_id: string;
          amount_usd: number;
          coin: string;
          chain: string;
          deposit_address: string;
          status: string;
          expires_at: string;
        }
      | null;
    if (!payment) throw new Error("Payment not found.");
    if (payment.status === "paid") return { status: "paid" as const };
    if (new Date(payment.expires_at) < new Date()) {
      await g.table(client, "payments").update({ status: "expired" }).eq("id", payment.id);
      throw new Error("This payment window has expired.");
    }

    const check = await verifyOnChain(
      payment.chain,
      data.tx_hash,
      payment.deposit_address,
      payment.amount_usd,
      payment.coin,
    );
    if (!check.ok) {
      if (check.pending) {
        await g.table(client, "payments").update({ status: "confirming", tx_hash: data.tx_hash }).eq("id", payment.id);
        return { status: "confirming" as const, message: check.message };
      }
      throw new Error(check.message);
    }

    const { data: updated } = await g
      .table(client, "payments")
      .update({
        status: "paid",
        tx_hash: data.tx_hash,
        paid_at: new Date().toISOString(),
        confirmations: check.confirmations ?? 1,
      })
      .eq("id", payment.id)
      .select("*")
      .single();

    const account = await g.getAccount(payment.user_id);
    await g.sendWebhook(account, "payment.paid", updated);
    await g.table(client, "transactions").insert({
      user_id: payment.user_id,
      chain: payment.chain,
      coin: payment.coin,
      amount: String((updated as { crypto_amount: number | null }).crypto_amount ?? 0),
      usd_value: payment.amount_usd,
      direction: "in",
      to_address: payment.deposit_address,
      tx_hash: data.tx_hash,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    });
    return { status: "paid" as const };
  });

async function verifyOnChain(
  chainLabel: string,
  hash: string,
  expectedTo: string,
  expectedUsd: number,
  coin: string,
): Promise<{ ok: boolean; pending?: boolean; message: string; confirmations?: number }> {
  const chainId = CHAIN_IDS[chainLabel];
  if (!chainId) {
    return {
      ok: false,
      pending: true,
      message: `${chainLabel} transactions are reviewed manually — we will settle it shortly.`,
    };
  }
  const { checkChainTransaction } = await import("./chain.functions");
  const result = await checkChainTransaction({ data: { chain: chainId as never, hash } });
  if (!result.found) return { ok: false, message: result.message ?? "Transaction not found on chain." };
  if (result.pending || result.status === "pending") {
    return { ok: false, pending: true, message: "Transaction is still pending confirmation." };
  }
  if (result.status === "failed") return { ok: false, message: "This transaction failed on chain." };
  if (result.to && expectedTo && result.to.toLowerCase() !== expectedTo.toLowerCase()) {
    return { ok: false, message: "Transaction was not sent to the payment address." };
  }
  if (result.coin && coin && result.coin.toUpperCase() !== coin.toUpperCase()) {
    return { ok: false, message: `Expected ${coin}, but this transaction moved ${result.coin}.` };
  }
  if (result.amount) {
    const g = await import("./gateway.server");
    const asset = g.assetFor(coin, chainLabel);
    const price = asset ? await g.priceUsd(asset.cgId) : 0;
    const paidUsd = Number(result.amount) * price;
    // 2% tolerance for rate movement between quote and settlement
    if (price > 0 && paidUsd < expectedUsd * 0.98) {
      return { ok: false, message: `Underpaid: received about $${paidUsd.toFixed(2)} of $${expectedUsd.toFixed(2)}.` };
    }
  }
  return { ok: true, message: "Confirmed", confirmations: 1 };
}
