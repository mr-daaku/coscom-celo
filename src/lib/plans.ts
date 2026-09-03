/** Plan catalogue — shared by client UI and server enforcement. */

export type PlanId = "free" | "cos" | "core";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  /** Gateway fee charged on every settled payment, in percent. */
  feePercent: number;
  /** Fee charged on withdrawals, in percent. */
  withdrawFeePercent: number;
  /** Maximum settled volume per calendar month, in USD. */
  monthlyVolumeUsd: number;
  /** Maximum single payment size, in USD. */
  maxPaymentUsd: number;
  /** Maximum API keys. */
  apiKeys: number;
  /** Minimum withdrawal, in USD. */
  minWithdrawUsd: number;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    feePercent: 3,
    withdrawFeePercent: 2,
    monthlyVolumeUsd: 5_000,
    maxPaymentUsd: 1_000,
    apiKeys: 1,
    minWithdrawUsd: 25,
    features: [
      "3% gateway fee",
      "2% withdrawal fee",
      "$5,000 monthly volume",
      "$1,000 max per payment",
      "1 API key",
      "Hosted checkout + SDK",
    ],
  },
  cos: {
    id: "cos",
    name: "Cos",
    priceUsd: 30,
    feePercent: 1.5,
    withdrawFeePercent: 1,
    monthlyVolumeUsd: 250_000,
    maxPaymentUsd: 25_000,
    apiKeys: 5,
    minWithdrawUsd: 10,
    features: [
      "1.5% gateway fee",
      "1% withdrawal fee",
      "$250,000 monthly volume",
      "$25,000 max per payment",
      "5 API keys",
      "Webhooks + priority confirmations",
    ],
  },
  core: {
    id: "core",
    name: "Core",
    priceUsd: 75,
    feePercent: 0.5,
    withdrawFeePercent: 0.5,
    monthlyVolumeUsd: 2_000_000,
    maxPaymentUsd: 250_000,
    apiKeys: 25,
    minWithdrawUsd: 5,
    features: [
      "0.5% gateway fee",
      "0.5% withdrawal fee",
      "$2,000,000 monthly volume",
      "$250,000 max per payment",
      "25 API keys",
      "Dedicated support + custom payout rules",
    ],
  },
};

export const PLAN_LIST = [PLANS.free, PLANS.cos, PLANS.core];

export const ADMIN_EMAIL = "mr.daaku.gd@gmail.com";

export function planOf(plan: string | null | undefined): Plan {
  return PLANS[(plan as PlanId) ?? "free"] ?? PLANS.free;
}

export function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
