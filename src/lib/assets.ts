/**
 * Client-safe catalogue of asset codes merchants use when creating invoices.
 * A code names the coin AND the network, e.g. `BEP20-USDT` vs `ERC20-USDT`.
 * `ALL-CHAIN-COIN` creates a USD invoice where the payer picks any supported asset.
 */
export const ALL_CHAIN_CODE = "ALL-CHAIN-COIN";

/** Marker stored on invoices that are not bound to one asset yet. */
export const ANY_ASSET = "ANY";
export const ANY_ADDRESS = "pending-selection";

export type AssetCode = { code: string; label: string; coin: string; chain: string };

export const ASSET_CODES: AssetCode[] = [
  { code: "BEP20-USDT", label: "USDT · BNB Smart Chain (BEP-20)", coin: "USDT", chain: "BSC" },
  { code: "ERC20-USDT", label: "USDT · Ethereum (ERC-20)", coin: "USDT", chain: "Ethereum" },
  { code: "TRC20-USDT", label: "USDT · TRON (TRC-20)", coin: "USDT", chain: "TRON" },
  { code: "ERC20-USDC", label: "USDC · Ethereum (ERC-20)", coin: "USDC", chain: "Ethereum" },
  { code: "POLYGON-USDC", label: "USDC · Polygon", coin: "USDC", chain: "Polygon" },
  { code: "BNB", label: "BNB · BNB Smart Chain", coin: "BNB", chain: "BSC" },
  { code: "ETH", label: "ETH · Ethereum", coin: "ETH", chain: "Ethereum" },
  { code: "BASE-ETH", label: "ETH · Base", coin: "ETH", chain: "Base" },
  { code: "BTC", label: "BTC · Bitcoin", coin: "BTC", chain: "Bitcoin" },
  { code: "TRX", label: "TRX · TRON", coin: "TRX", chain: "TRON" },
  { code: "SOL", label: "SOL · Solana", coin: "SOL", chain: "Solana" },
  { code: "TON", label: "TON · The Open Network", coin: "TON", chain: "TON" },
  { code: "POL", label: "POL · Polygon", coin: "POL", chain: "Polygon" },
];

const ALIASES: Record<string, string> = {
  ALLCHAIN: ALL_CHAIN_CODE,
  "ALL-CHAIN": ALL_CHAIN_CODE,
  "ALL-COIN": ALL_CHAIN_CODE,
  "ALL-CHAIN-COIN": ALL_CHAIN_CODE,
  ANY: ALL_CHAIN_CODE,
  "USDT-BEP20": "BEP20-USDT",
  "USDT-ERC20": "ERC20-USDT",
  "USDT-TRC20": "TRC20-USDT",
  "USDC-ERC20": "ERC20-USDC",
  "USDC-POLYGON": "POLYGON-USDC",
  "MATIC-USDC": "POLYGON-USDC",
  "TRC20-TRX": "TRX",
  "BEP20-BNB": "BNB",
  "ERC20-ETH": "ETH",
  "SPL-SOL": "SOL",
  MATIC: "POL",
  USDT: "TRC20-USDT",
  USDC: "ERC20-USDC",
};

export function normalizeAssetCode(input: string) {
  const code = input.trim().toUpperCase().replace(/[\s_]+/g, "-");
  return ALIASES[code] ?? code;
}

/** Resolve an asset code. Returns `{ kind: "any" }` for the all-chain invoice type. */
export function resolveAssetCode(
  input: string,
): { kind: "any" } | { kind: "asset"; coin: string; chain: string; code: string } {
  const code = normalizeAssetCode(input);
  if (code === ALL_CHAIN_CODE) return { kind: "any" };
  const found = ASSET_CODES.find((a) => a.code === code);
  if (!found) {
    throw new Error(
      `Unknown asset code "${input}". Use one of: ${ASSET_CODES.map((a) => a.code).join(", ")}, ${ALL_CHAIN_CODE}.`,
    );
  }
  return { kind: "asset", coin: found.coin, chain: found.chain, code: found.code };
}

export function assetCodeOf(coin: string, chain: string) {
  return (
    ASSET_CODES.find(
      (a) => a.coin.toUpperCase() === coin.toUpperCase() && a.chain.toLowerCase() === chain.toLowerCase(),
    )?.code ?? `${coin}-${chain}`.toUpperCase()
  );
}
