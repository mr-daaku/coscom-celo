export type CoscomUser = {
  id: string;
  name: string;
  email: string;
  picture?: string;
};

export const USER_STORAGE_KEY = "coscom_user";

export function readUser(): CoscomUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CoscomUser) : null;
  } catch {
    return null;
  }
}

export function writeUser(user: CoscomUser) {
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export const DEMO_USER: CoscomUser = {
  id: "usr_8f21c",
  name: "Aarav Mehta",
  email: "aarav@coscompay.io",
};

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  status: "active" | "revoked";
  permissions: string[];
  created: string;
  lastUsed: string;
};

export const PERMISSIONS = [
  "payments:read",
  "payments:write",
  "webhooks:manage",
  "invoices:manage",
] as const;

export const API_KEYS: ApiKey[] = [
  {
    id: "key_1",
    name: "Production API",
    key: "cmp_live_sk_9f2c41ab77de4a1b8c05e3d6",
    status: "active",
    permissions: ["payments:read", "payments:write", "webhooks:manage"],
    created: "12 Mar 2026",
    lastUsed: "2 hours ago",
  },
  {
    id: "key_2",
    name: "Test Environment",
    key: "cmp_test_sk_5b71ee0d2a934f76ba18c4d2",
    status: "active",
    permissions: ["payments:read", "payments:write"],
    created: "28 Feb 2026",
    lastUsed: "Yesterday",
  },
  {
    id: "key_3",
    name: "Legacy Integration",
    key: "cmp_live_sk_1a04bb93cc6e42f0aa77d519",
    status: "revoked",
    permissions: ["payments:read"],
    created: "04 Jan 2026",
    lastUsed: "18 Feb 2026",
  },
];

export type Transaction = {
  id: string;
  type: "incoming" | "outgoing";
  amount: string;
  currency: string;
  network: string;
  status: "confirmed" | "pending" | "failed";
  date: string;
  hash: string;
};

export const TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    type: "incoming",
    amount: "0.045",
    currency: "BTC",
    network: "Bitcoin",
    status: "confirmed",
    date: "02 Sep 2026, 14:22",
    hash: "0x7f2c…41ab",
  },
  {
    id: "tx_2",
    type: "incoming",
    amount: "1,250",
    currency: "USDT",
    network: "TRON",
    status: "confirmed",
    date: "02 Sep 2026, 11:04",
    hash: "0x5b71…0d2a",
  },
  {
    id: "tx_3",
    type: "outgoing",
    amount: "500",
    currency: "USDC",
    network: "Ethereum",
    status: "pending",
    date: "01 Sep 2026, 19:47",
    hash: "0x1a04…93cc",
  },
  {
    id: "tx_4",
    type: "incoming",
    amount: "2.5",
    currency: "ETH",
    network: "Ethereum",
    status: "confirmed",
    date: "01 Sep 2026, 09:12",
    hash: "0x9dd3…77e1",
  },
  {
    id: "tx_5",
    type: "incoming",
    amount: "15,000",
    currency: "TRX",
    network: "TRON",
    status: "failed",
    date: "31 Aug 2026, 22:38",
    hash: "0x33af…b902",
  },
];

export const INVOICES = [
  {
    id: "INV-2041",
    customer: "Nordwind Studio",
    amount: "$4,200.00",
    status: "paid" as const,
    date: "02 Sep 2026",
  },
  {
    id: "INV-2040",
    customer: "Helio Labs",
    amount: "$1,180.00",
    status: "paid" as const,
    date: "31 Aug 2026",
  },
  {
    id: "INV-2039",
    customer: "Kettle & Co",
    amount: "$860.00",
    status: "pending" as const,
    date: "29 Aug 2026",
  },
  {
    id: "INV-2038",
    customer: "Rakuya Digital",
    amount: "$12,400.00",
    status: "paid" as const,
    date: "26 Aug 2026",
  },
  {
    id: "INV-2037",
    customer: "Orbit Freight",
    amount: "$2,050.00",
    status: "pending" as const,
    date: "24 Aug 2026",
  },
];

export const WALLETS = [
  { chain: "Bitcoin", symbol: "BTC", balance: "0.4521", usd: "$50,842", color: "#F7931A" },
  { chain: "Ethereum", symbol: "ETH", balance: "12.847", usd: "$55,042", color: "#627EEA" },
  { chain: "TRON", symbol: "TRX", balance: "45,280", usd: "$12,678", color: "#FF0013" },
  { chain: "Solana", symbol: "SOL", balance: "89.5", usd: "$14,320", color: "#9945FF" },
  { chain: "BNB Chain", symbol: "BNB", balance: "24.3", usd: "$14,580", color: "#F0B90B" },
  { chain: "Polygon", symbol: "MATIC", balance: "15,420", usd: "$8,920", color: "#8247E5" },
];

export const TOKENS = [
  { symbol: "USDT", name: "Tether USD", price: "$1.00", image: "/assets/usdt.png" },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", image: "/assets/usdc.png" },
  { symbol: "BNB", name: "BNB Chain", price: "$600", image: "/assets/bnb.png" },
  { symbol: "ETH", name: "Ethereum", price: "$4,284", image: "/assets/eth.png" },
  { symbol: "TRX", name: "TRON", price: "$0.28", image: "/assets/trx.png" },
  { symbol: "TON", name: "Toncoin", price: "$5.30", image: "/assets/ton.png" },
  { symbol: "BTC", name: "Bitcoin", price: "$112,480", image: "/assets/btc.png" },
];

export const TOKEN_NETWORKS: Record<
  string,
  { chain: string; standard: string; confirmations: number }[]
> = {
  USDT: [
    { chain: "BSC", standard: "BEP-20", confirmations: 15 },
    { chain: "Ethereum", standard: "ERC-20", confirmations: 12 },
    { chain: "TRON", standard: "TRC-20", confirmations: 20 },
    { chain: "Polygon", standard: "ERC-20", confirmations: 128 },
    { chain: "Solana", standard: "SPL", confirmations: 1 },
  ],
  USDC: [
    { chain: "BSC", standard: "BEP-20", confirmations: 15 },
    { chain: "Ethereum", standard: "ERC-20", confirmations: 12 },
    { chain: "Polygon", standard: "ERC-20", confirmations: 128 },
    { chain: "Solana", standard: "SPL", confirmations: 1 },
  ],
  BNB: [{ chain: "BSC", standard: "Native", confirmations: 15 }],
  ETH: [{ chain: "Ethereum", standard: "Native", confirmations: 12 }],
  TRX: [{ chain: "TRON", standard: "Native", confirmations: 20 }],
  TON: [{ chain: "TON", standard: "Native", confirmations: 1 }],
  BTC: [{ chain: "Bitcoin", standard: "Native", confirmations: 2 }],
};

export const NETWORK_COLORS: Record<string, string> = {
  BSC: "#F0B90B",
  Ethereum: "#627EEA",
  TRON: "#FF0013",
  Polygon: "#8247E5",
  Solana: "#9945FF",
  TON: "#0098EA",
  Bitcoin: "#F7931A",
};

export const DEPOSIT_ADDRESSES: Record<string, string> = {
  Bitcoin: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  Ethereum: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  BSC: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
  Polygon: "0x2f318C334780961FB129D2a6c30D0763d9a5C970",
  TRON: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  Solana: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
  TON: "UQD2NmD_lH5f-9-CQY6PGmy4A2VjRkMPBiZ5Q5Y6H_pMkV5x",
};

export const WORKERS = [
  {
    name: "checkout-router",
    region: "Global",
    invocations: "1.2M",
    latency: "18ms",
    status: "active" as const,
  },
  {
    name: "webhook-dispatcher",
    region: "Global",
    invocations: "842K",
    latency: "24ms",
    status: "active" as const,
  },
  {
    name: "rate-oracle",
    region: "Global",
    invocations: "3.4M",
    latency: "11ms",
    status: "active" as const,
  },
  {
    name: "settlement-batcher",
    region: "EU",
    invocations: "96K",
    latency: "62ms",
    status: "paused" as const,
  },
];
