import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  confirmPlanPayment,
  createPayment,
  getMerchantOverview,
  requestWithdrawal,
  rotateWebhookSecret,
  startPlanCheckout,
  updateMerchantSettings,
} from "@/lib/gateway.functions";
import { PLAN_LIST, money } from "@/lib/plans";
import { cn } from "@/lib/utils";

const PAIRS = [
  { coin: "USDT", chain: "TRON" },
  { coin: "USDT", chain: "BSC" },
  { coin: "USDC", chain: "Ethereum" },
  { coin: "ETH", chain: "Ethereum" },
  { coin: "BTC", chain: "Bitcoin" },
  { coin: "SOL", chain: "Solana" },
  { coin: "BNB", chain: "BSC" },
  { coin: "TON", chain: "TON" },
];

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

function useOverview() {
  return useQuery({
    queryKey: ["merchant-overview"],
    queryFn: () => getMerchantOverview(),
  });
}

function errText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

/* ------------------------------- Charges -------------------------------- */

type ChargeRow = {
  id: string;
  reference: string;
  amount_usd: number;
  coin: string;
  chain: string;
  crypto_amount: number | null;
  fee_usd: number;
  net_usd: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
};

export function ChargesTab() {
  const qc = useQueryClient();
  const overview = useOverview();
  const [amount, setAmount] = useState("49.99");
  const [pair, setPair] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const charges = useQuery({
    queryKey: ["charges"],
    queryFn: async () => {
      const { data, error: err } = await (supabase as never as {
        from: (t: string) => {
          select: (c: string) => {
            order: (o: string, opt: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }>;
          };
        };
      })
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);
      return (data ?? []) as ChargeRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const selected = PAIRS[pair]!;
      return createPayment({
        data: {
          amount_usd: Number(amount),
          coin: selected.coin,
          chain: selected.chain,
          ...(note ? { description: note } : {}),
        },
      });
    },
    onSuccess: (payment) => {
      setError(null);
      setLink(`${window.location.origin}/pay?ref=${String(payment["reference"])}`);
      void qc.invalidateQueries({ queryKey: ["charges"] });
      void qc.invalidateQueries({ queryKey: ["merchant-overview"] });
    },
    onError: (e) => setError(errText(e)),
  });

  const plan = overview.data?.plan;

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-fraunces text-lg font-bold">New payment link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {plan
            ? `${plan.name} plan · ${plan.feePercent}% gateway fee · up to ${money(plan.maxPaymentUsd)} per payment`
            : "Loading plan limits…"}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="amt">Amount (USD)</Label>
            <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pair">Coin / network</Label>
            <select
              id="pair"
              value={pair}
              onChange={(e) => setPair(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {PAIRS.map((p, i) => (
                <option key={`${p.coin}-${p.chain}`} value={i}>
                  {p.coin} · {p.chain}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="note">Description</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Order #1024" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {link && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted p-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{link}</code>
            <Button size="icon" variant="ghost" aria-label="Copy checkout link" onClick={() => void navigator.clipboard.writeText(link)}>
              <Copy className="size-4" />
            </Button>
          </div>
        )}
        <Button className="mt-4" disabled={create.isPending} onClick={() => create.mutate()}>
          {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Create payment
        </Button>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Asset</th>
              <th className="p-4">Fee</th>
              <th className="p-4">Net</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(charges.data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0">
                <td className="p-4 font-mono text-xs">{c.reference}</td>
                <td className="p-4">{money(Number(c.amount_usd))}</td>
                <td className="p-4">
                  {c.coin} · {c.chain}
                </td>
                <td className="p-4">{money(Number(c.fee_usd))}</td>
                <td className="p-4">{money(Number(c.net_usd))}</td>
                <td className="p-4">
                  <Badge variant="outline">{c.status}</Badge>
                </td>
              </tr>
            ))}
            {charges.data?.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No payments yet — create your first payment link above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ------------------------------ Withdrawals ----------------------------- */

type WithdrawalRow = {
  id: string;
  coin: string;
  chain: string;
  to_address: string;
  amount_usd: number;
  fee_usd: number;
  net_usd: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
};

export function WithdrawalsTab() {
  const qc = useQueryClient();
  const overview = useOverview();
  const [amount, setAmount] = useState("");
  const [pair, setPair] = useState(0);
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data, error: err } = await (supabase as never as {
        from: (t: string) => {
          select: (c: string) => {
            order: (o: string, opt: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }>;
          };
        };
      })
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);
      return (data ?? []) as WithdrawalRow[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const selected = PAIRS[pair]!;
      return requestWithdrawal({
        data: { amount_usd: Number(amount), coin: selected.coin, chain: selected.chain, to_address: to },
      });
    },
    onSuccess: () => {
      setError(null);
      setAmount("");
      setTo("");
      void qc.invalidateQueries({ queryKey: ["withdrawals"] });
      void qc.invalidateQueries({ queryKey: ["merchant-overview"] });
    },
    onError: (e) => setError(errText(e)),
  });

  const plan = overview.data?.plan;
  const balance = overview.data?.stats.balanceUsd ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted-foreground">Available balance</p>
          <p className="mt-1 font-fraunces text-2xl font-bold">{money(balance)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Withdrawal fee</p>
          <p className="mt-1 font-fraunces text-2xl font-bold">{plan ? `${plan.withdrawFeePercent}%` : "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Minimum withdrawal</p>
          <p className="mt-1 font-fraunces text-2xl font-bold">{plan ? money(plan.minWithdrawUsd) : "—"}</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-fraunces text-lg font-bold">Request a payout</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="wamt">Amount (USD)</Label>
            <Input id="wamt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="wpair">Coin / network</Label>
            <select
              id="wpair"
              value={pair}
              onChange={(e) => setPair(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {PAIRS.map((p, i) => (
                <option key={`${p.coin}-${p.chain}`} value={i}>
                  {p.coin} · {p.chain}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="wto">Destination address</Label>
            <Input id="wto" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Your wallet address" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button className="mt-4" disabled={submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Request withdrawal
        </Button>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-4">Requested</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Fee</th>
              <th className="p-4">Net</th>
              <th className="p-4">Destination</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((w) => (
              <tr key={w.id} className="border-b border-border/60 last:border-0">
                <td className="p-4">{new Date(w.created_at).toLocaleString()}</td>
                <td className="p-4">{money(Number(w.amount_usd))}</td>
                <td className="p-4">{money(Number(w.fee_usd))}</td>
                <td className="p-4">{money(Number(w.net_usd))}</td>
                <td className="p-4 font-mono text-xs">{w.to_address.slice(0, 10)}…</td>
                <td className="p-4">
                  <Badge variant="outline">{w.status}</Badge>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No withdrawals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* -------------------------------- Billing ------------------------------- */

export function BillingTab() {
  const qc = useQueryClient();
  const overview = useOverview();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [hash, setHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const start = useMutation({
    mutationFn: (plan: "cos" | "core") => startPlanCheckout({ data: { plan } }),
    onSuccess: (row) => {
      setError(null);
      setDone(false);
      setOrder(row);
    },
    onError: (e) => setError(errText(e)),
  });

  const confirm = useMutation({
    mutationFn: () => confirmPlanPayment({ data: { id: String(order?.["id"]), tx_hash: hash } }),
    onSuccess: () => {
      setError(null);
      setDone(true);
      setOrder(null);
      setHash("");
      void qc.invalidateQueries({ queryKey: ["merchant-overview"] });
    },
    onError: (e) => setError(errText(e)),
  });

  const current = overview.data?.account.plan ?? "free";
  const volume = overview.data?.volumeUsd ?? 0;
  const limit = overview.data?.plan.monthlyVolumeUsd ?? 0;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Current plan</p>
            <p className="font-fraunces text-2xl font-bold capitalize">{current}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Volume this month</p>
            <p className="font-mono text-sm">
              {money(volume)} / {money(limit)}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${limit ? Math.min(100, (volume / limit) * 100) : 0}%` }}
          />
        </div>
        {overview.data?.account.plan_expires_at && (
          <p className="mt-3 text-xs text-muted-foreground">
            Renews / expires on {new Date(overview.data.account.plan_expires_at).toLocaleDateString()}
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_LIST.map((plan) => (
          <Card key={plan.id} className={cn(plan.id === current && "border-primary")}>
            <div className="flex items-baseline justify-between">
              <h3 className="font-fraunces text-xl font-bold">{plan.name}</h3>
              <p className="font-mono text-sm">{plan.priceUsd === 0 ? "Free" : `$${plan.priceUsd}/mo`}</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full"
              variant={plan.id === current ? "outline" : "default"}
              disabled={plan.id === current || plan.id === "free" || start.isPending}
              onClick={() => start.mutate(plan.id as "cos" | "core")}
            >
              {plan.id === current ? "Current plan" : plan.id === "free" ? "Default" : `Pay with crypto`}
            </Button>
          </Card>
        ))}
      </div>

      {done && <Card className="border-primary text-sm">Plan activated — new fees apply immediately.</Card>}

      {order && (
        <Card>
          <h3 className="font-fraunces text-lg font-bold">
            Pay {money(Number(order["price_usd"]))} in {String(order["coin"])} ({String(order["chain"])})
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Send the exact amount to the address below, then paste your transaction hash. We verify it on-chain before
            activating your plan.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted p-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{String(order["deposit_address"])}</code>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Copy address"
              onClick={() => void navigator.clipboard.writeText(String(order["deposit_address"]))}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="mt-4">
            <Label htmlFor="planhash">Transaction hash</Label>
            <Input id="planhash" value={hash} onChange={(e) => setHash(e.target.value)} />
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <Button className="mt-4" disabled={!hash || confirm.isPending} onClick={() => confirm.mutate()}>
            {confirm.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Verify payment
          </Button>
        </Card>
      )}
      {error && !order && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/* --------------------------- Account settings --------------------------- */

export function AccountTab() {
  const qc = useQueryClient();
  const overview = useOverview();
  const account = overview.data?.account;
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const values =
    form ??
    ({
      business_name: account?.business_name ?? "",
      support_email: account?.support_email ?? "",
      payout_address: account?.payout_address ?? "",
      payout_chain: account?.payout_chain ?? "",
      webhook_url: account?.webhook_url ?? "",
    } as Record<string, string>);

  const set = (key: string, value: string) => setForm({ ...values, [key]: value });

  const save = useMutation({
    mutationFn: () => updateMerchantSettings({ data: values as never }),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ["merchant-overview"] });
    },
    onError: (e) => setError(errText(e)),
  });

  const rotate = useMutation({
    mutationFn: () => rotateWebhookSecret(),
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["merchant-overview"] });
    },
    onError: (e) => setError(errText(e)),
  });

  if (!account) {
    return (
      <Card>
        <Loader2 className="size-5 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-fraunces text-lg font-bold">Account settings</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="bn">Business name</Label>
            <Input id="bn" value={values["business_name"] ?? ""} onChange={(e) => set("business_name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="se">Support email</Label>
            <Input id="se" type="email" value={values["support_email"] ?? ""} onChange={(e) => set("support_email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pa">Payout address</Label>
            <Input id="pa" value={values["payout_address"] ?? ""} onChange={(e) => set("payout_address", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pc">Payout network</Label>
            <Input id="pc" value={values["payout_chain"] ?? ""} onChange={(e) => set("payout_chain", e.target.value)} placeholder="TRON" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="wh">Webhook URL (https only)</Label>
            <Input id="wh" value={values["webhook_url"] ?? ""} onChange={(e) => set("webhook_url", e.target.value)} placeholder="https://your-shop.com/hooks/coscompay" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-4 flex items-center gap-3">
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
          </Button>
          {saved && <span className="text-xs text-primary">Saved</span>}
        </div>
      </Card>

      <Card>
        <h2 className="font-fraunces text-lg font-bold">Webhook signing secret</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every webhook is signed with HMAC-SHA256 in the <code className="font-mono">x-coscompay-signature</code> header.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted p-2">
          <code className="min-w-0 flex-1 truncate font-mono text-xs">{account.webhook_secret}</code>
          <Button size="icon" variant="ghost" aria-label="Copy secret" onClick={() => void navigator.clipboard.writeText(account.webhook_secret)}>
            <Copy className="size-4" />
          </Button>
        </div>
        <Button variant="outline" className="mt-4 gap-2" disabled={rotate.isPending} onClick={() => rotate.mutate()}>
          <RefreshCw className="size-4" /> Rotate secret
        </Button>
      </Card>
    </div>
  );
}
