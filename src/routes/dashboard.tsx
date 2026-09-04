import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, Banknote, ShieldCheck } from "lucide-react";

import { AccountTab, BillingTab, ChargesTab, WithdrawalsTab } from "@/components/dashboard/GatewayTabs";
import { amIAdmin } from "@/lib/admin.functions";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { initials, useAuth } from "@/lib/auth";
import { CHAINS, checkChainTransaction, type ChainId } from "@/lib/chain.functions";
import { PERMISSIONS } from "@/lib/coscom";
import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/version";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "charges", label: "Payments", icon: CreditCard },
  { id: "billing", label: "Billing & Plans", icon: BadgeDollarSign },
  { id: "withdrawals", label: "Withdrawals", icon: Banknote },
  { id: "api-keys", label: "API Keys", icon: KeyRound },
  { id: "payments", label: "On-chain TXs", icon: ArrowDownLeft },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "account", label: "Account", icon: Settings },
  { id: "settings", label: "Profile", icon: Settings },
] as const;


type TabId = (typeof TABS)[number]["id"];

type ApiKeyRow = {
  id: string;
  name: string;
  key: string;
  status: string;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
};

type TransactionRow = {
  id: string;
  chain: string;
  coin: string;
  amount: string;
  usd_value: number | null;
  direction: string;
  from_address: string | null;
  to_address: string | null;
  tx_hash: string;
  status: string;
  fee: string | null;
  block_number: number | null;
  confirmed_at: string | null;
  created_at: string;
};

type InvoiceRow = {
  id: string;
  number: string;
  customer_name: string;
  customer_email: string | null;
  amount: number;
  coin: string | null;
  status: string;
  created_at: string;
};

type WalletRow = {
  id: string;
  chain: string;
  coin: string;
  address: string;
  label: string | null;
};

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (TABS.some((t) => t.id === search["tab"]) ? search["tab"] : "overview") as TabId,
  }),
  head: () => ({
    meta: [
      { title: "Merchant Dashboard — CosComPay" },
      {
        name: "description",
        content:
          "Manage crypto payments, API keys, invoices, wallets and analytics from your CosComPay merchant dashboard.",
      },
      { property: "og:title", content: "Merchant Dashboard — CosComPay" },
      {
        property: "og:description",
        content: "Crypto payments, keys, invoices and wallets in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function useRows<T>(table: string, userId: string | undefined, columns: string, order = "created_at") {
  return useQuery({
    queryKey: [table, userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            order: (
              o: string,
              opts: { ascending: boolean },
            ) => Promise<{ data: unknown; error: { message: string } | null }>;
          };
        };
      };
      const { data, error } = await client
        .from(table)
        .select(columns)
        .order(order, { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });
}

function DashboardPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { ready, user, name, email, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminCheck = useQuery({
    queryKey: ["am-i-admin"],
    enabled: Boolean(user),
    retry: false,
    queryFn: () => amIAdmin(),
  });
  const isAdmin = adminCheck.data?.admin ?? false;

  // Platform owner never sees the merchant workspace — straight to the admin console.
  useEffect(() => {
    if (isAdmin) void navigate({ to: "/admin", replace: true });
  }, [isAdmin, navigate]);


  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
          <h1 className="font-fraunces text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Google to open your merchant dashboard.
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <img
            src={logo}
            alt="CosComPay logo"
            width={32}
            height={32}
            loading="lazy"
            className="size-8 rounded-xl"
          />
          <span className="font-fraunces text-lg font-bold">CosComPay</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {TABS.map((t) => (
            <Link
              key={t.id}
              to="/dashboard"
              search={{ tab: t.id }}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                t.id === active.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <ShieldCheck className="size-4" />
              Admin console
            </Link>
          )}
        </nav>


        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">CosComPay v{APP_VERSION}</p>
          <Button
            variant="outline"
            className="mt-3 w-full gap-2"
            onClick={() => {
              void signOut().then(() => navigate({ to: "/" }));
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close menu"
          className="animate-fade-in fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="font-fraunces text-lg font-bold">{active.label}</h1>
          <span className="ml-auto flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initials(name)}
          </span>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {active.id === "overview" && <OverviewTab userId={user.id} firstName={name.split(" ")[0] ?? name} />}
          {active.id === "charges" && <ChargesTab />}
          {active.id === "billing" && <BillingTab />}
          {active.id === "withdrawals" && <WithdrawalsTab />}
          {active.id === "account" && <AccountTab />}
          {active.id === "api-keys" && <ApiKeysTab userId={user.id} />}
          {active.id === "payments" && <PaymentsTab userId={user.id} />}
          {active.id === "invoices" && <InvoicesTab userId={user.id} />}
          {active.id === "wallets" && <WalletsTab userId={user.id} />}
          {active.id === "analytics" && <AnalyticsTab userId={user.id} />}
          {active.id === "settings" && <SettingsTab userId={user.id} name={name} email={email} />}

        </div>
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-xl", className)}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "confirmed" || status === "paid" || status === "active"
      ? "border-primary/40 text-primary"
      : status === "pending"
        ? "border-warning/40 text-warning"
        : "border-destructive/40 text-destructive";
  return (
    <Badge variant="outline" className={tone}>
      {status}
    </Badge>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Card className="text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
    </Card>
  );
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OverviewTab({ userId, firstName }: { userId: string; firstName: string }) {
  const txs = useRows<TransactionRow>("transactions", userId, "*");
  const keys = useRows<ApiKeyRow>("api_keys", userId, "*");

  const rows = txs.data ?? [];
  const confirmed = rows.filter((t) => t.status === "confirmed");
  const revenue = confirmed
    .filter((t) => t.direction === "incoming")
    .reduce((sum, t) => sum + (t.usd_value ?? 0), 0);
  const activeKeys = (keys.data ?? []).filter((k) => k.status === "active").length;
  const successRate = rows.length ? Math.round((confirmed.length / rows.length) * 1000) / 10 : 0;

  const stats = [
    { label: "Verified revenue", value: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: `${confirmed.length} confirmed on-chain` },
    { label: "Active API keys", value: String(activeKeys), sub: `${(keys.data ?? []).length - activeKeys} revoked` },
    { label: "Transactions", value: String(rows.length), sub: "verified through chain checker" },
    { label: "Success rate", value: `${successRate}%`, sub: `${rows.length - confirmed.length} not confirmed` },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/20 via-accent/10 to-transparent p-6">
        <h2 className="font-fraunces text-2xl font-bold">Welcome back, {firstName} 👋</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Verify any payment on-chain from the Payments tab — results are saved to your account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-fraunces text-2xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-fraunces text-base font-semibold">Recent transactions</h3>
          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No transactions yet. Verify your first payment in the Payments tab.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {rows.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        tx.direction === "incoming"
                          ? "bg-primary/15 text-primary"
                          : "bg-accent/15 text-accent",
                      )}
                    >
                      {tx.direction === "incoming" ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {tx.amount} {tx.coin}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tx.chain} · {fmtDate(tx.confirmed_at ?? tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-fraunces text-base font-semibold">Quick actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/dashboard" search={{ tab: "api-keys" }}>
                <KeyRound className="size-4" /> Create API key
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/dashboard" search={{ tab: "invoices" }}>
                <FileText className="size-4" /> Create invoice
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/dashboard" search={{ tab: "payments" }}>
                <CreditCard className="size-4" /> Verify a payment
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/dashboard" search={{ tab: "wallets" }}>
                <Wallet className="size-4" /> Add wallet
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ApiKeysTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const keys = useRows<ApiKeyRow>("api_keys", userId, "*");
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<string[]>(["payments:read"]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["api_keys", userId] });

  const create = useMutation({
    mutationFn: async () => {
      const random = crypto.getRandomValues(new Uint8Array(16));
      const secret = Array.from(random)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const { error } = await supabase.from("api_keys").insert({
        user_id: userId,
        name: name.trim() || "Untitled key",
        key: `cmp_live_sk_${secret}`,
        permissions: perms.length ? perms : ["payments:read"],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setModal(false);
      setName("");
      setPerms(["payments:read"]);
      invalidate();
    },
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-fraunces text-xl font-bold">API Keys</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Secret keys for server-side requests. Never expose them in a browser.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setModal(true)}>
          <Plus className="size-4" /> Create API key
        </Button>
      </div>

      {keys.isLoading && <Loader2 className="size-6 animate-spin text-primary" />}

      {!keys.isLoading && (keys.data ?? []).length === 0 && (
        <EmptyState title="No API keys yet" hint="Create your first key to start integrating." />
      )}

      <div className="space-y-4">
        {(keys.data ?? []).map((k) => (
          <Card key={k.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{k.name}</p>
                  <StatusBadge status={k.status} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <code className="min-w-0 truncate rounded-lg bg-muted px-2.5 py-1.5 font-mono text-xs">
                    {visible[k.id] ? k.key : `${k.key.slice(0, 12)}${"•".repeat(12)}`}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Toggle key visibility"
                    onClick={() => setVisible((v) => ({ ...v, [k.id]: !v[k.id] }))}
                  >
                    {visible[k.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Copy key"
                    onClick={() => {
                      void navigator.clipboard.writeText(k.key);
                      setCopied(k.id);
                      setTimeout(() => setCopied(null), 1500);
                    }}
                  >
                    {copied === k.id ? (
                      <Check className="size-4 text-primary" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {k.permissions.map((p) => (
                    <span
                      key={p}
                      className="rounded-lg bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Created {fmtDate(k.created_at)} · Last used {k.last_used_at ? fmtDate(k.last_used_at) : "never"}
                </p>
              </div>
              <div className="flex gap-2">
                {k.status === "active" && (
                  <Button variant="outline" size="sm" onClick={() => revoke.mutate(k.id)}>
                    Revoke
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete key"
                  className="text-destructive"
                  onClick={() => remove.mutate(k.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="animate-scale-in w-full max-w-md rounded-3xl border border-border bg-card p-6">
            <h3 className="font-fraunces text-lg font-bold">Create API key</h3>
            <div className="mt-5 space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production API"
              />
            </div>
            <div className="mt-5 space-y-3">
              <Label>Permissions</Label>
              {PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={perms.includes(p)}
                    onCheckedChange={(checked) =>
                      setPerms((cur) => (checked ? [...cur, p] : cur.filter((x) => x !== p)))
                    }
                  />
                  <span className="font-mono text-xs">{p}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                className="flex-1"
                disabled={create.isPending}
                onClick={() => create.mutate()}
              >
                {create.isPending ? "Creating…" : "Create key"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const txs = useRows<TransactionRow>("transactions", userId, "*");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [chain, setChain] = useState<ChainId>("ethereum");
  const [hash, setHash] = useState("");
  const [usd, setUsd] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const verify = useMutation({
    mutationFn: async () => {
      const result = await checkChainTransaction({ data: { chain, hash: hash.trim() } });
      if (!result.found) throw new Error(result.message ?? "Transaction not found");
      const { error } = await supabase.from("transactions").upsert(
        {
          user_id: userId,
          chain: result.chainLabel,
          coin: result.coin ?? "",
          amount: result.amount ?? "0",
          usd_value: usd ? Number(usd) : null,
          direction: "incoming",
          from_address: result.from ?? null,
          to_address: result.to ?? null,
          tx_hash: result.hash,
          status: result.status ?? "pending",
          block_number: result.blockNumber ?? null,
          fee: result.fee ?? null,
          confirmed_at: result.timestamp ?? null,
        },
        { onConflict: "user_id,tx_hash" },
      );
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      setMessage(
        `${result.type ?? "Transaction"} ${result.status} · ${result.amount} ${result.coin} on ${result.chainLabel}`,
      );
      setHash("");
      setUsd("");
      void qc.invalidateQueries({ queryKey: ["transactions", userId] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Verification failed"),
  });

  const rows = useMemo(
    () =>
      (txs.data ?? []).filter(
        (t) =>
          (status === "all" || t.status === status) &&
          `${t.coin} ${t.chain} ${t.tx_hash}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [txs.data, query, status],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-fraunces text-xl font-bold">Transactions</h2>
      </div>

      <Card>
        <h3 className="font-fraunces text-base font-semibold">Verify a payment on-chain</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Paste a transaction hash — CosComPay reads it straight from the network RPC and records
          the result.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_130px_auto]">
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as ChainId)}
            className="h-9 rounded-xl border border-input bg-card px-3 text-sm"
            aria-label="Network"
          >
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <Input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Transaction hash / signature"
            className="font-mono text-xs"
          />
          <Input
            value={usd}
            onChange={(e) => setUsd(e.target.value)}
            placeholder="USD value"
            inputMode="decimal"
          />
          <Button
            className="gap-2"
            disabled={verify.isPending || hash.trim().length < 10}
            onClick={() => {
              setMessage(null);
              verify.mutate();
            }}
          >
            {verify.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Verify
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
      </Card>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by asset, network or hash"
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-xl border border-input bg-card px-3 text-sm"
          aria-label="Status filter"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card/90 backdrop-blur-xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border text-left">
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Network</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Tx hash</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="p-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2",
                      t.direction === "incoming" ? "text-primary" : "text-accent",
                    )}
                  >
                    {t.direction === "incoming" ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                    {t.direction}
                  </span>
                </td>
                <td className="p-4">
                  {t.amount} {t.coin}
                </td>
                <td className="p-4 text-muted-foreground">{t.chain}</td>
                <td className="p-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="p-4 text-muted-foreground">
                  {fmtDate(t.confirmed_at ?? t.created_at)}
                </td>
                <td className="max-w-56 truncate p-4 font-mono text-xs text-muted-foreground">
                  {t.tx_hash}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No transactions yet — verify a hash above to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoicesTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const invoices = useRows<InvoiceRow>("invoices", userId, "*");
  const [modal, setModal] = useState(false);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({
        user_id: userId,
        number: `INV-${Date.now().toString().slice(-6)}`,
        customer_name: customer.trim() || "Customer",
        amount: Number(amount || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setModal(false);
      setCustomer("");
      setAmount("");
      void qc.invalidateQueries({ queryKey: ["invoices", userId] });
    },
  });

  const rows = invoices.data ?? [];
  const paid = rows.filter((i) => i.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-fraunces text-xl font-bold">Invoices</h2>
        <Button className="gap-2" onClick={() => setModal(true)}>
          <Plus className="size-4" /> Create invoice
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: rows.length },
          { label: "Paid", value: paid },
          { label: "Pending", value: rows.length - paid },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-fraunces text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No invoices yet" hint="Create an invoice to bill a customer in crypto." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/90 backdrop-blur-xl">
          {rows.map((inv, i) => (
            <div
              key={inv.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-4 p-5",
                i > 0 && "border-t border-border",
              )}
            >
              <div>
                <p className="font-mono text-sm">{inv.number}</p>
                <p className="text-xs text-muted-foreground">{inv.customer_name}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span>${Number(inv.amount).toLocaleString()}</span>
                <StatusBadge status={inv.status} />
                <span className="text-muted-foreground">{fmtDate(inv.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="animate-scale-in w-full max-w-md rounded-3xl border border-border bg-card p-6">
            <h3 className="font-fraunces text-lg font-bold">Create invoice</h3>
            <div className="mt-5 space-y-2">
              <Label htmlFor="inv-customer">Customer</Label>
              <Input
                id="inv-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="inv-amount">Amount (USD)</Label>
              <Input
                id="inv-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="249"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" disabled={create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? "Creating…" : "Create invoice"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const wallets = useRows<WalletRow>("wallets", userId, "*");
  const [chain, setChain] = useState("Ethereum");
  const [coin, setCoin] = useState("ETH");
  const [address, setAddress] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("wallets").insert({
        user_id: userId,
        chain,
        coin,
        address: address.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAddress("");
      void qc.invalidateQueries({ queryKey: ["wallets", userId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wallets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["wallets", userId] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-fraunces text-xl font-bold">Wallets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your own non-custodial payout addresses — funds never touch CosComPay.
        </p>
      </div>

      <Card>
        <h3 className="font-fraunces text-base font-semibold">Add wallet</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_2fr_auto]">
          <Input value={chain} onChange={(e) => setChain(e.target.value)} placeholder="Chain" />
          <Input value={coin} onChange={(e) => setCoin(e.target.value)} placeholder="Coin" />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Payout address"
            className="font-mono text-xs"
          />
          <Button disabled={add.isPending || address.trim().length < 6} onClick={() => add.mutate()}>
            Add
          </Button>
        </div>
      </Card>

      {(wallets.data ?? []).length === 0 ? (
        <EmptyState title="No wallets yet" hint="Add a payout address for each chain you accept." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(wallets.data ?? []).map((w) => (
            <Card key={w.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{w.chain}</p>
                  <p className="text-xs text-muted-foreground">{w.coin}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  aria-label="Remove wallet"
                  onClick={() => remove.mutate(w.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <code className="mt-4 block truncate rounded-lg bg-muted px-2.5 py-2 font-mono text-xs">
                {w.address}
              </code>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Bars({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Card>
      <h3 className="font-fraunces text-base font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Not enough data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{d.label}</span>
                <span>{d.value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(d.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AnalyticsTab({ userId }: { userId: string }) {
  const txs = useRows<TransactionRow>("transactions", userId, "*");
  const rows = txs.data ?? [];
  const confirmed = rows.filter((t) => t.status === "confirmed");
  const revenue = confirmed.reduce((sum, t) => sum + (t.usd_value ?? 0), 0);

  const group = (pick: (t: TransactionRow) => string) => {
    const map = new Map<string, number>();
    for (const t of rows) map.set(pick(t), (map.get(pick(t)) ?? 0) + 1);
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Verified revenue", value: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
          {
            label: "Avg transaction",
            value: confirmed.length
              ? `$${(revenue / confirmed.length).toFixed(2)}`
              : "$0.00",
          },
          { label: "Total transactions", value: String(rows.length) },
          {
            label: "Success rate",
            value: rows.length ? `${Math.round((confirmed.length / rows.length) * 100)}%` : "0%",
          },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-fraunces text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bars title="Top coins by count" data={group((t) => t.coin || "—")} />
        <Bars title="Network distribution" data={group((t) => t.chain || "—")} />
      </div>
    </div>
  );
}

function SettingsTab({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(name);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      void qc.invalidateQueries();
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <h3 className="font-fraunces text-base font-semibold">Profile</h3>
        <div className="mt-5 flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary">
            {initials(name)}
          </span>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" value={email} readOnly />
          </div>
        </div>
        <Button className="mt-5" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : saved ? "Saved" : "Save changes"}
        </Button>
      </Card>

      <Card className="border-destructive/40">
        <h3 className="font-fraunces text-base font-semibold text-destructive">Danger zone</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Need your account and all records removed? Contact support and we'll erase everything
          tied to {email}.
        </p>
        <Separator className="my-4" />
        <Button variant="destructive" asChild>
          <a href={`mailto:support@coscompay.io?subject=Delete my account (${email})`}>
            Request deletion
          </a>
        </Button>
      </Card>
    </div>
  );
}
