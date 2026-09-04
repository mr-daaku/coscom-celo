import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminOverview,
  adminSetPlan,
  adminSetSuspended,
  adminUpdatePlanSettings,
  adminUpdateWithdrawal,
  type AdminPaymentDTO,
  type PlanSettingsDTO,
} from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — CosComPay" },
      {
        name: "description",
        content: "Restricted CosComPay admin console for merchants, payouts, plan control and platform revenue.",
      },
      { property: "og:title", content: "Admin Console — CosComPay" },
      { property: "og:description", content: "Restricted platform administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-xl", className)}>{children}</div>
  );
}

type MerchantRow = {
  user_id: string;
  business_name: string | null;
  plan: string;
  plan_status: string;
  plan_expires_at: string | null;
  suspended: boolean;
  created_at: string;
  email?: string | null;
};

type WithdrawalRow = {
  id: string;
  user_id: string;
  coin: string;
  chain: string;
  to_address: string;
  amount_usd: number;
  net_usd: number;
  status: string;
  created_at: string;
};

function AdminPage() {
  const { ready, user } = useAuth();
  const qc = useQueryClient();
  const [hashes, setHashes] = useState<Record<string, string>>({});

  const overview = useQuery({
    queryKey: ["admin-overview"],
    enabled: Boolean(user),
    retry: false,
    queryFn: () => adminOverview(),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-overview"] });
  const suspend = useMutation({
    mutationFn: (input: { user_id: string; suspended: boolean }) => adminSetSuspended({ data: input }),
    onSuccess: invalidate,
  });
  const setPlan = useMutation({
    mutationFn: (input: { user_id: string; plan: "free" | "cos" | "core" }) =>
      adminSetPlan({ data: { ...input, months: 1 } }),
    onSuccess: invalidate,
  });
  const savePlan = useMutation({
    mutationFn: (input: PlanSettingsDTO) =>
      adminUpdatePlanSettings({
        data: {
          plan: input.plan,
          price_usd: Number(input.price_usd),
          fee_percent: Number(input.fee_percent),
          withdraw_fee_percent: Number(input.withdraw_fee_percent),
          monthly_volume_usd: Number(input.monthly_volume_usd),
          max_payment_usd: Number(input.max_payment_usd),
          api_keys: Number(input.api_keys),
          min_withdraw_usd: Number(input.min_withdraw_usd),
        },
      }),
    onSuccess: invalidate,
  });
  const updateWithdrawal = useMutation({
    mutationFn: (input: { id: string; status: "processing" | "sent" | "rejected"; tx_hash?: string }) =>
      adminUpdateWithdrawal({ data: input }),
    onSuccess: invalidate,
  });

  if (!ready || (user && overview.isLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!user || overview.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="font-fraunces text-2xl font-bold">Restricted area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This console is limited to the platform owner account.
          </p>
          <Button className="mt-6 w-full" asChild>
            {user ? (
              <Link to="/dashboard" search={{ tab: "overview" }}>
                Back to dashboard
              </Link>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </Button>

        </Card>
      </main>
    );
  }

  const data = overview.data!;
  const merchants = data.merchants as unknown as MerchantRow[];
  const withdrawals = data.withdrawals as unknown as WithdrawalRow[];
  const payments = (data.payments ?? []) as unknown as AdminPaymentDTO[];
  const planSettings = (data.planSettings ?? []) as unknown as PlanSettingsDTO[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="font-fraunces text-2xl font-bold sm:text-3xl">Admin console</h1>
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <Link to="/dashboard" search={{ tab: "overview" }}>Dashboard</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Merchants", value: String(data.totals.merchants) },
          { label: "Settled volume", value: money(data.totals.volumeUsd) },
          { label: "Fee revenue", value: money(data.totals.feeRevenueUsd) },
          { label: "Subscription revenue", value: money(data.totals.subscriptionRevenueUsd) },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-fraunces text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 font-fraunces text-xl font-bold">Merchants</h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-4">Merchant</th>
              <th className="p-4">Email</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Expires</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.user_id} className="border-b border-border/60 last:border-0">
                <td className="p-4">
                  <p className="font-medium">{m.business_name ?? "Unnamed merchant"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{m.user_id.slice(0, 8)}…</p>
                </td>
                <td className="p-4 text-xs text-muted-foreground">{m.email ?? "—"}</td>
                <td className="p-4 capitalize">{m.plan}</td>
                <td className="p-4">{m.plan_expires_at ? new Date(m.plan_expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-4">
                  <Badge variant="outline" className={m.suspended ? "border-destructive/40 text-destructive" : "border-primary/40 text-primary"}>
                    {m.suspended ? "suspended" : "active"}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <select
                      aria-label="Set plan"
                      value={m.plan}
                      onChange={(e) => setPlan.mutate({ user_id: m.user_id, plan: e.target.value as "free" | "cos" | "core" })}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="free">free</option>
                      <option value="cos">cos</option>
                      <option value="core">core</option>
                    </select>
                    <Button
                      size="sm"
                      variant={m.suspended ? "outline" : "destructive"}
                      onClick={() => suspend.mutate({ user_id: m.user_id, suspended: !m.suspended })}
                    >
                      {m.suspended ? "Unsuspend" : "Suspend"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mt-10 font-fraunces text-xl font-bold">Payments</h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-4">Created</th>
              <th className="p-4">Reference</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Fee</th>
              <th className="p-4">Asset</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tx</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0">
                <td className="p-4 whitespace-nowrap">{new Date(p.created_at).toLocaleString()}</td>
                <td className="p-4 font-mono text-xs">{p.reference}</td>
                <td className="p-4">{money(Number(p.amount_usd))}</td>
                <td className="p-4">{money(Number(p.fee_usd))}</td>
                <td className="p-4 whitespace-nowrap">
                  {p.coin} · {p.chain}
                </td>
                <td className="p-4">
                  <Badge variant="outline" className={p.status === "paid" ? "border-primary/40 text-primary" : ""}>
                    {p.status}
                  </Badge>
                </td>
                <td className="p-4 font-mono text-xs text-muted-foreground">
                  {p.tx_hash ? `${p.tx_hash.slice(0, 12)}…` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mt-10 font-fraunces text-xl font-bold">Plans, fees and limits</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {planSettings.map((row) => (
          <PlanEditor
            key={row.plan}
            row={row}
            saving={savePlan.isPending}
            onSave={(next) => savePlan.mutate(next)}
          />
        ))}
      </div>

      <h2 className="mt-10 font-fraunces text-xl font-bold">
        Withdrawals{" "}
        <span className="text-sm font-normal text-muted-foreground">({data.totals.pendingWithdrawals} pending)</span>
      </h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-4">Requested</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Net payout</th>
              <th className="p-4">Destination</th>
              <th className="p-4">Status</th>
              <th className="p-4">Settle</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-border/60 last:border-0">
                <td className="p-4">{new Date(w.created_at).toLocaleString()}</td>
                <td className="p-4">{money(Number(w.amount_usd))}</td>
                <td className="p-4">
                  {money(Number(w.net_usd))} · {w.coin} {w.chain}
                </td>
                <td className="p-4 font-mono text-xs">{w.to_address.slice(0, 14)}…</td>
                <td className="p-4">
                  <Badge variant="outline">{w.status}</Badge>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label="Payout transaction hash"
                      className="h-9 w-40"
                      placeholder="tx hash"
                      value={hashes[w.id] ?? ""}
                      onChange={(e) => setHashes({ ...hashes, [w.id]: e.target.value })}
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        updateWithdrawal.mutate({
                          id: w.id,
                          status: "sent",
                          ...(hashes[w.id] ? { tx_hash: hashes[w.id]! } : {}),
                        })
                      }
                    >
                      Mark sent
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateWithdrawal.mutate({ id: w.id, status: "rejected" })}>
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No withdrawal requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}


const PLAN_FIELDS: { key: keyof PlanSettingsDTO; label: string }[] = [
  { key: "price_usd", label: "Price / month ($)" },
  { key: "fee_percent", label: "Gateway fee (%)" },
  { key: "withdraw_fee_percent", label: "Withdrawal fee (%)" },
  { key: "monthly_volume_usd", label: "Monthly volume limit ($)" },
  { key: "max_payment_usd", label: "Max single payment ($)" },
  { key: "api_keys", label: "API keys" },
  { key: "min_withdraw_usd", label: "Minimum withdrawal ($)" },
];

function PlanEditor({
  row,
  saving,
  onSave,
}: {
  row: PlanSettingsDTO;
  saving: boolean;
  onSave: (next: PlanSettingsDTO) => void;
}) {
  const [draft, setDraft] = useState<PlanSettingsDTO>(row);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-fraunces text-lg font-bold capitalize">{row.plan}</h3>
        <Badge variant="outline" className="border-primary/40 text-primary">
          {money(Number(draft.price_usd))}/mo
        </Badge>
      </div>
      <div className="mt-4 space-y-3">
        {PLAN_FIELDS.map((f) => (
          <label key={String(f.key)} className="block">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="mt-1 h-9"
              value={String(draft[f.key] ?? 0)}
              onChange={(e) => setDraft({ ...draft, [f.key]: Number(e.target.value) })}
            />
          </label>
        ))}
      </div>
      <Button className="mt-4 w-full" disabled={saving} onClick={() => onSave(draft)}>
        {saving ? "Saving…" : "Save plan"}
      </Button>
    </Card>
  );
}
