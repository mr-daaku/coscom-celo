/**
 * Server-only gateway core: pricing, API key authentication, rate limiting,
 * webhook signing and plan enforcement. Never import this from components.
 */
import { PLANS, planOf, type Plan, type PlanId } from "./plans";

export type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

export async function admin(): Promise<AdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Loose table accessor: gateway tables may be newer than generated types. */
export function table(client: AdminClient, name: string) {
  return (client as unknown as { from: (t: string) => any }).from(name);
}

export const SUPPORTED: { coin: string; chain: string; decimals: number; cgId: string }[] = [
  { coin: "BTC", chain: "Bitcoin", decimals: 8, cgId: "bitcoin" },
  { coin: "ETH", chain: "Ethereum", decimals: 6, cgId: "ethereum" },
  { coin: "ETH", chain: "Base", decimals: 6, cgId: "ethereum" },
  { coin: "USDT", chain: "TRON", decimals: 2, cgId: "tether" },
  { coin: "USDT", chain: "BSC", decimals: 2, cgId: "tether" },
  { coin: "USDT", chain: "Ethereum", decimals: 2, cgId: "tether" },
  { coin: "USDC", chain: "Ethereum", decimals: 2, cgId: "usd-coin" },
  { coin: "USDC", chain: "Polygon", decimals: 2, cgId: "usd-coin" },
  { coin: "BNB", chain: "BSC", decimals: 4, cgId: "binancecoin" },
  { coin: "SOL", chain: "Solana", decimals: 4, cgId: "solana" },
  { coin: "TRX", chain: "TRON", decimals: 2, cgId: "tron" },
  { coin: "TON", chain: "TON", decimals: 3, cgId: "the-open-network" },
  { coin: "POL", chain: "Polygon", decimals: 2, cgId: "matic-network" },
];

export function assetFor(coin: string, chain: string) {
  return SUPPORTED.find(
    (a) => a.coin.toUpperCase() === coin.toUpperCase() && a.chain.toLowerCase() === chain.toLowerCase(),
  );
}

export {
  ALL_CHAIN_CODE,
  ANY_ADDRESS,
  ANY_ASSET,
  ASSET_CODES,
  assetCodeOf,
  resolveAssetCode,
} from "./assets";

const FALLBACK_PRICES: Record<string, number> = {
  bitcoin: 112480,
  ethereum: 4284,
  tether: 1,
  "usd-coin": 1,
  binancecoin: 600,
  solana: 178.4,
  tron: 0.28,
  "the-open-network": 5.3,
  "matic-network": 0.42,
};

const priceCache = new Map<string, { value: number; at: number }>();

export async function priceUsd(cgId: string): Promise<number> {
  const cached = priceCache.get(cgId);
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cgId)}&vs_currencies=usd`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) throw new Error(`price HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, { usd?: number }>;
    const value = json[cgId]?.usd;
    if (!value || !Number.isFinite(value)) throw new Error("no price");
    priceCache.set(cgId, { value, at: Date.now() });
    return value;
  } catch {
    return FALLBACK_PRICES[cgId] ?? 1;
  }
}

/** Deposit address for a chain: merchant wallet first, platform address second. */
export async function depositAddress(userId: string, chain: string): Promise<string> {
  const client = await admin();
  const { data } = await table(client, "wallets")
    .select("address, chain")
    .eq("user_id", userId)
    .ilike("chain", chain)
    .limit(1);
  const own = (data as { address: string }[] | null)?.[0]?.address;
  if (own) return own;
  const { DEPOSIT_ADDRESSES } = await import("./coscom");
  const fallback = DEPOSIT_ADDRESSES[chain];
  if (!fallback) throw new Error(`No deposit address configured for ${chain}`);
  return fallback;
}

export async function getAccount(userId: string) {
  const client = await admin();
  const { data } = await table(client, "merchant_accounts").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as AccountRow;
  const { data: created, error } = await table(client, "merchant_accounts")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return created as AccountRow;
}

export type AccountRow = {
  user_id: string;
  business_name: string | null;
  support_email: string | null;
  payout_address: string | null;
  payout_chain: string | null;
  webhook_url: string | null;
  webhook_secret: string;
  plan: PlanId;
  plan_status: string;
  plan_expires_at: string | null;
  suspended: boolean;
};

type PlanSettingsRow = {
  plan: string;
  price_usd: number;
  fee_percent: number;
  withdraw_fee_percent: number;
  monthly_volume_usd: number;
  max_payment_usd: number;
  api_keys: number;
  min_withdraw_usd: number;
};

let planCache: { at: number; map: Record<PlanId, Plan> } | undefined;

/** Plan catalogue with admin overrides applied (falls back to the static defaults). */
export async function planCatalogue(): Promise<Record<PlanId, Plan>> {
  if (planCache && Date.now() - planCache.at < 30_000) return planCache.map;
  const map: Record<PlanId, Plan> = {
    free: { ...PLANS.free },
    cos: { ...PLANS.cos },
    core: { ...PLANS.core },
  };
  try {
    const client = await admin();
    const { data } = await table(client, "plan_settings").select("*");
    for (const row of ((data as PlanSettingsRow[] | null) ?? [])) {
      const id = row.plan as PlanId;
      if (!map[id]) continue;
      map[id] = {
        ...map[id],
        priceUsd: Number(row.price_usd),
        feePercent: Number(row.fee_percent),
        withdrawFeePercent: Number(row.withdraw_fee_percent),
        monthlyVolumeUsd: Number(row.monthly_volume_usd),
        maxPaymentUsd: Number(row.max_payment_usd),
        apiKeys: Number(row.api_keys),
        minWithdrawUsd: Number(row.min_withdraw_usd),
      };
    }
  } catch {
    // fall back to static defaults
  }
  planCache = { at: Date.now(), map };
  return map;
}

export function invalidatePlanCache() {
  planCache = undefined;
}

/** Effective plan: a paid plan past its expiry falls back to Free. */
export async function effectivePlan(account: AccountRow): Promise<Plan> {
  const map = await planCatalogue();
  if (account.plan !== "free") {
    const expired = account.plan_expires_at ? new Date(account.plan_expires_at) < new Date() : true;
    if (expired || account.plan_status !== "active") return map.free;
  }
  return map[(account.plan as PlanId) ?? "free"] ?? map.free;
}

export async function monthlyVolumeUsd(userId: string): Promise<number> {
  const client = await admin();
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { data } = await table(client, "payments")
    .select("amount_usd")
    .eq("user_id", userId)
    .eq("status", "paid")
    .gte("created_at", start.toISOString());
  return ((data as { amount_usd: number }[] | null) ?? []).reduce(
    (sum, row) => sum + Number(row.amount_usd),
    0,
  );
}

/** Fixed-window rate limiter backed by the database (survives worker restarts). */
export async function rateLimit(bucket: string, limit: number, windowSeconds = 60) {
  const client = await admin();
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const { data } = await table(client, "api_rate_limits")
    .select("id, count")
    .eq("bucket", bucket)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();
  const row = data as { id: string; count: number } | null;
  if (!row) {
    await table(client, "api_rate_limits").insert({
      bucket,
      window_start: windowStart.toISOString(),
      count: 1,
    });
    return { allowed: true, remaining: limit - 1 };
  }
  if (row.count >= limit) return { allowed: false, remaining: 0 };
  await table(client, "api_rate_limits").update({ count: row.count + 1 }).eq("id", row.id);
  return { allowed: true, remaining: limit - row.count - 1 };
}

export type ApiKeyRecord = { id: string; user_id: string; permissions: string[]; status: string };

/** Authenticate an inbound API request by its secret key. */
export async function authenticateApiKey(request: Request): Promise<
  { ok: true; key: ApiKeyRecord } | { ok: false; response: Response }
> {
  const header = request.headers.get("authorization");
  const raw = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (request.headers.get("x-api-key") ?? "").trim();

  if (!raw || raw.length < 16) return { ok: false, response: json({ error: "Missing API key" }, 401) };

  const client = await admin();
  const { data } = await table(client, "api_keys")
    .select("id, user_id, permissions, status")
    .eq("key", raw)
    .maybeSingle();
  const key = data as ApiKeyRecord | null;
  if (!key || key.status !== "active") {
    return { ok: false, response: json({ error: "Invalid or revoked API key" }, 401) };
  }

  const limited = await rateLimit(`key:${key.id}`, 120, 60);
  if (!limited.allowed) {
    return { ok: false, response: json({ error: "Rate limit exceeded" }, 429) };
  }

  await table(client, "api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);
  return { ok: true, key };
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

/** Signed webhook delivery so merchants can trust the callback. */
export async function sendWebhook(account: AccountRow, event: string, payload: unknown) {
  if (!account.webhook_url) return;
  let url: URL;
  try {
    url = new URL(account.webhook_url);
  } catch {
    return;
  }
  // SSRF guard: only public https endpoints.
  const host = url.hostname;
  const blocked =
    url.protocol !== "https:" ||
    host === "localhost" ||
    host.endsWith(".local") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) return;

  const body = JSON.stringify({ event, data: payload, sent_at: new Date().toISOString() });
  const { createHmac } = await import("crypto");
  const signature = createHmac("sha256", account.webhook_secret).update(body).digest("hex");
  try {
    await fetch(url.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-coscompay-signature": signature,
        "x-coscompay-event": event,
      },
      body,
    });
  } catch {
    // delivery failures are non-fatal for the payment itself
  }
}

export function newReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return `cos_${Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 18)}`;
}

/** Platform wallet that receives plan subscription payments. */
export const PLAN_PAYMENT_ASSET = { coin: "USDT", chain: "TRON" };

export async function assertPaymentAllowed(userId: string, amountUsd: number) {
  const account = await getAccount(userId);
  if (account.suspended) throw new Error("This account is suspended. Contact support.");
  const plan = await effectivePlan(account);
  if (amountUsd > plan.maxPaymentUsd) {
    throw new Error(
      `Your ${plan.name} plan allows payments up to $${plan.maxPaymentUsd.toLocaleString()}. Upgrade to accept more.`,
    );
  }
  const volume = await monthlyVolumeUsd(userId);
  if (volume + amountUsd > plan.monthlyVolumeUsd) {
    throw new Error(
      `Monthly volume limit reached for the ${plan.name} plan ($${plan.monthlyVolumeUsd.toLocaleString()}). Upgrade to continue.`,
    );
  }
  return { account, plan };
}
