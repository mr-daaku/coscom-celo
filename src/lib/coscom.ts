export const PERMISSIONS = [
  "payments:read",
  "payments:write",
  "webhooks:manage",
  "invoices:manage",
] as const;

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
