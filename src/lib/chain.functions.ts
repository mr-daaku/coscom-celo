import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * On-chain transaction verification, ported from the chain-checker scripts
 * (eth / bsc / pol / base / trc / sol / ton) to server functions.
 */

export const CHAINS = [
  { id: "ethereum", label: "Ethereum", coin: "ETH", kind: "evm" },
  { id: "bsc", label: "BNB Chain", coin: "BNB", kind: "evm" },
  { id: "polygon", label: "Polygon", coin: "POL", kind: "evm" },
  { id: "base", label: "Base", coin: "ETH", kind: "evm" },
  { id: "tron", label: "TRON", coin: "TRX", kind: "evm" },
  { id: "solana", label: "Solana", coin: "SOL", kind: "solana" },
  { id: "ton", label: "TON", coin: "TON", kind: "ton" },
] as const;

export type ChainId = (typeof CHAINS)[number]["id"];

const RPC: Record<string, string[]> = {
  ethereum: ["https://ethereum-rpc.publicnode.com"],
  bsc: ["https://bsc-dataseed.bnbchain.org"],
  polygon: ["https://polygon-bor-rpc.publicnode.com", "https://polygon.drpc.org"],
  base: ["https://mainnet.base.org"],
  tron: ["https://api.trongrid.io/jsonrpc"],
  solana: ["https://api.mainnet-beta.solana.com"],
};

const EXPLORER: Record<ChainId, (hash: string) => string> = {
  ethereum: (h) => `https://etherscan.io/tx/${h}`,
  bsc: (h) => `https://bscscan.com/tx/${h}`,
  polygon: (h) => `https://polygonscan.com/tx/${h}`,
  base: (h) => `https://basescan.org/tx/${h}`,
  tron: (h) => `https://tronscan.org/#/transaction/${h.replace(/^0x/, "")}`,
  solana: (h) => `https://solscan.io/tx/${h}`,
  ton: (h) => `https://tonviewer.com/transaction/${h}`,
};

const NATIVE_DECIMALS: Record<string, number> = {
  ethereum: 18,
  bsc: 18,
  polygon: 18,
  base: 18,
  tron: 6,
  solana: 9,
  ton: 9,
};

export type ChainTxResult = {
  found: boolean;
  pending?: boolean;
  message?: string;
  chain: ChainId;
  chainLabel: string;
  hash: string;
  status?: "confirmed" | "failed" | "pending";
  type?: string;
  coin?: string;
  tokenName?: string;
  contract?: string;
  amount?: string;
  from?: string;
  to?: string;
  fee?: string;
  feeCoin?: string;
  blockNumber?: number;
  timestamp?: string | undefined;
  explorerUrl: string;
};

async function rpcCall(urls: string[], method: string, params: unknown[]) {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
      const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
      if (json.error) throw new Error(json.error.message ?? "RPC error");
      return json.result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("RPC unavailable");
}

function formatUnits(value: bigint, decimals: number) {
  if (decimals === 0) return value.toString();
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  if (fraction === 0n) return whole.toString();
  const fractionString = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fractionString}`;
}

function hexToBigInt(hex: unknown) {
  return BigInt((typeof hex === "string" && hex) || "0x0");
}

function decodeHexString(result: string, fallback: string) {
  try {
    const hex = result.slice(2);
    if (hex.length < 128) return fallback;
    const offset = parseInt(hex.slice(0, 64), 16);
    const length = parseInt(hex.slice(offset * 2, offset * 2 + 64), 16);
    const data = hex.slice(offset * 2 + 64, offset * 2 + 64 + length * 2);
    const bytes = data.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? [];
    const decoded = new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0/g, "").trim();
    return decoded || fallback;
  } catch {
    return fallback;
  }
}

async function tokenMeta(urls: string[], contract: string) {
  const call = async (data: string) => {
    try {
      return (await rpcCall(urls, "eth_call", [{ to: contract, data }, "latest"])) as string;
    } catch {
      return "0x";
    }
  };
  const [nameRaw, symbolRaw, decimalsRaw] = await Promise.all([
    call("0x06fdde03"),
    call("0x95d89b41"),
    call("0x313ce567"),
  ]);
  return {
    name: nameRaw && nameRaw !== "0x" ? decodeHexString(nameRaw, "Unknown Token") : "Unknown Token",
    symbol: symbolRaw && symbolRaw !== "0x" ? decodeHexString(symbolRaw, "TOKEN") : "TOKEN",
    decimals: decimalsRaw && decimalsRaw !== "0x" ? Number(hexToBigInt(decimalsRaw)) : 18,
  };
}

function decodeTransferInput(input: string | undefined) {
  if (!input || input.length < 138) return null;
  if (input.slice(0, 10).toLowerCase() !== "0xa9059cbb") return null;
  const data = input.slice(10);
  return {
    to: `0x${data.slice(24, 64)}`,
    amount: BigInt(`0x${data.slice(64, 128)}`),
  };
}

async function checkEvm(chain: ChainId, hash: string): Promise<ChainTxResult> {
  const urls = RPC[chain]!;
  const base: ChainTxResult = {
    found: false,
    chain,
    chainLabel: CHAINS.find((c) => c.id === chain)!.label,
    hash,
    explorerUrl: EXPLORER[chain](hash),
  };

  const tx = (await rpcCall(urls, "eth_getTransactionByHash", [hash])) as {
    hash: string;
    from: string;
    to: string | null;
    value: string;
    input: string;
    gasPrice: string;
    blockNumber: string | null;
  } | null;

  if (!tx) return { ...base, message: "Transaction not found on this network." };

  const receipt = (await rpcCall(urls, "eth_getTransactionReceipt", [hash])) as {
    status: string;
    gasUsed: string;
  } | null;

  if (!receipt) {
    return { ...base, found: true, pending: true, status: "pending", message: "Transaction is still pending." };
  }

  const nativeCoin = CHAINS.find((c) => c.id === chain)!.coin;
  const decimals = NATIVE_DECIMALS[chain]!;
  const fee = formatUnits(hexToBigInt(receipt.gasUsed) * hexToBigInt(tx.gasPrice), decimals);
  const blockNumber = tx.blockNumber ? Number(hexToBigInt(tx.blockNumber)) : undefined;

  let timestamp: string | undefined;
  if (tx.blockNumber) {
    try {
      const block = (await rpcCall(urls, "eth_getBlockByNumber", [tx.blockNumber, false])) as {
        timestamp: string;
      } | null;
      if (block?.timestamp) {
        timestamp = new Date(Number(hexToBigInt(block.timestamp)) * 1000).toISOString();
      }
    } catch {
      timestamp = undefined;
    }
  }

  const transfer = decodeTransferInput(tx.input);
  const status = receipt.status === "0x1" ? "confirmed" : "failed";

  if (transfer && tx.to) {
    const meta = await tokenMeta(urls, tx.to);
    return {
      ...base,
      found: true,
      status,
      type: "Token transfer",
      coin: meta.symbol,
      tokenName: meta.name,
      contract: tx.to,
      amount: formatUnits(transfer.amount, meta.decimals),
      from: tx.from,
      to: transfer.to,
      fee,
      feeCoin: nativeCoin,
      ...(blockNumber !== undefined ? { blockNumber } : {}),
      timestamp,
    };
  }

  return {
    ...base,
    found: true,
    status,
    type: "Native transfer",
    coin: nativeCoin,
    amount: formatUnits(hexToBigInt(tx.value), decimals),
    from: tx.from,
    to: tx.to ?? "",
    fee,
    feeCoin: nativeCoin,
    ...(blockNumber !== undefined ? { blockNumber } : {}),
    timestamp,
  };
}

async function checkSolana(hash: string): Promise<ChainTxResult> {
  const urls = RPC["solana"]!;
  const base: ChainTxResult = {
    found: false,
    chain: "solana",
    chainLabel: "Solana",
    hash,
    explorerUrl: EXPLORER.solana(hash),
  };

  const result = (await rpcCall(urls, "getTransaction", [
    hash,
    { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  ])) as {
    slot: number;
    blockTime?: number;
    meta: {
      err: unknown;
      fee: number;
      preBalances: number[];
      postBalances: number[];
      preTokenBalances?: { mint: string; owner: string; uiTokenAmount: { amount: string; decimals: number } }[];
      postTokenBalances?: { mint: string; owner: string; uiTokenAmount: { amount: string; decimals: number } }[];
    } | null;
    transaction: { message: { accountKeys: { pubkey: string; signer?: boolean }[] } };
  } | null;

  if (!result) return { ...base, message: "Transaction not found on Solana." };
  if (!result.meta) return { ...base, message: "Transaction metadata unavailable." };

  const meta = result.meta;
  const keys = result.transaction.message.accountKeys ?? [];
  const status = meta.err === null ? "confirmed" : "failed";

  const post = meta.postTokenBalances ?? [];
  const pre = meta.preTokenBalances ?? [];
  let tokenLeg: { amount: string; owner: string; mint: string } | null = null;
  for (const p of post) {
    const before = pre.find((x) => x.mint === p.mint && x.owner === p.owner);
    const delta = BigInt(p.uiTokenAmount.amount) - BigInt(before?.uiTokenAmount.amount ?? "0");
    if (delta > 0n) {
      tokenLeg = {
        amount: formatUnits(delta, p.uiTokenAmount.decimals),
        owner: p.owner,
        mint: p.mint,
      };
      break;
    }
  }

  const fee = formatUnits(BigInt(meta.fee || 0), 9);
  const timestamp = result.blockTime ? new Date(result.blockTime * 1000).toISOString() : undefined;
  const payer = keys[0]?.pubkey ?? "";

  if (tokenLeg) {
    return {
      ...base,
      found: true,
      status,
      type: "SPL token transfer",
      coin: "SPL",
      contract: tokenLeg.mint,
      amount: tokenLeg.amount,
      from: payer,
      to: tokenLeg.owner,
      fee,
      feeCoin: "SOL",
      blockNumber: result.slot,
      timestamp,
    };
  }

  let received = 0n;
  let receiver = "";
  for (let i = 0; i < (meta.postBalances?.length ?? 0); i += 1) {
    const delta = BigInt(meta.postBalances[i] ?? 0) - BigInt(meta.preBalances[i] ?? 0);
    if (delta > received) {
      received = delta;
      receiver = keys[i]?.pubkey ?? "";
    }
  }

  return {
    ...base,
    found: true,
    status,
    type: "SOL transfer",
    coin: "SOL",
    amount: formatUnits(received, 9),
    from: payer,
    to: receiver,
    fee,
    feeCoin: "SOL",
    blockNumber: result.slot,
    timestamp,
  };
}

async function checkTon(hash: string): Promise<ChainTxResult> {
  const base: ChainTxResult = {
    found: false,
    chain: "ton",
    chainLabel: "TON",
    hash,
    explorerUrl: EXPLORER.ton(hash),
  };

  const url = new URL("https://toncenter.com/api/v3/transactions");
  url.searchParams.set("hash", hash);
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { ...base, message: `TON API error ${res.status}` };

  const json = (await res.json()) as {
    transactions?: {
      hash: string;
      now: number;
      total_fees: string;
      description?: { aborted?: boolean };
      in_msg?: { source?: string; destination?: string; value?: string };
    }[];
  };

  const tx = json.transactions?.[0];
  if (!tx) return { ...base, message: "Transaction not found on TON." };

  const value = BigInt(tx.in_msg?.value ?? "0");
  return {
    ...base,
    found: true,
    status: tx.description?.aborted ? "failed" : "confirmed",
    type: "TON transfer",
    coin: "TON",
    amount: formatUnits(value, 9),
    from: tx.in_msg?.source ?? "",
    to: tx.in_msg?.destination ?? "",
    fee: formatUnits(BigInt(tx.total_fees ?? "0"), 9),
    feeCoin: "TON",
    timestamp: tx.now ? new Date(tx.now * 1000).toISOString() : undefined,
  };
}

export const checkChainTransaction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        chain: z.enum(["ethereum", "bsc", "polygon", "base", "tron", "solana", "ton"]),
        hash: z.string().trim().min(10).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ChainTxResult> => {
    const { chain } = data;
    let hash = data.hash;

    if (chain === "solana" || chain === "ton") {
      // signatures / base64 hashes are used as-is
    } else if (!hash.startsWith("0x")) {
      hash = `0x${hash}`;
    }

    try {
      if (chain === "solana") return await checkSolana(hash);
      if (chain === "ton") return await checkTon(hash);
      return await checkEvm(chain, hash);
    } catch (error) {
      return {
        found: false,
        chain,
        chainLabel: CHAINS.find((c) => c.id === chain)!.label,
        hash,
        explorerUrl: EXPLORER[chain](hash),
        message: error instanceof Error ? error.message : "Lookup failed",
      };
    }
  });
