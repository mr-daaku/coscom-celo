import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  API_KEYS,
  clearUser,
  initials,
  INVOICES,
  PERMISSIONS,
  readUser,
  TRANSACTIONS,
  WALLETS,
  type ApiKey,
  type CoscomUser,
} from "@/lib/coscom";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "api-keys", label: "API Keys", icon: KeyRound },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

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

function DashboardPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [user, setUser] = useState<CoscomUser | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(readUser());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
          <h1 className="font-fraunces text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to open your merchant dashboard.
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];
  const signOut = () => {
    clearUser();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
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
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" className="mt-3 w-full gap-2" onClick={signOut}>
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

      {/* Main */}
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
          <div className="relative ml-auto hidden w-64 sm:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-9" />
          </div>
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initials(user.name)}
          </span>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {active.id === "overview" && <OverviewTab user={user} />}
          {active.id === "api-keys" && <ApiKeysTab />}
          {active.id === "payments" && <PaymentsTab />}
          {active.id === "invoices" && <InvoicesTab />}
          {active.id === "wallets" && <WalletsTab />}
          {active.id === "analytics" && <AnalyticsTab />}
          {active.id === "settings" && <SettingsTab user={user} />}
        </div>
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-xl",
        className,
      )}
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

function OverviewTab({ user }: { user: CoscomUser }) {
  const stats = [
    { label: "Total Revenue", value: "$24,892", sub: "+12.4% vs last month" },
    { label: "Active API Keys", value: "2", sub: "1 revoked" },
    { label: "Transactions (30d)", value: "1,482", sub: "+8.1% vs last month" },
    { label: "Success Rate", value: "99.2%", sub: "5 failed payments" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/20 via-accent/10 to-transparent p-6">
        <h2 className="font-fraunces text-2xl font-bold">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your gateway processed 42 payments in the last 24 hours.
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
          <div className="mt-4 space-y-3">
            {TRANSACTIONS.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      tx.type === "incoming"
                        ? "bg-primary/15 text-primary"
                        : "bg-accent/15 text-accent",
                    )}
                  >
                    {tx.type === "incoming" ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {tx.amount} {tx.currency}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tx.network} · {tx.date}
                    </p>
                  </div>
                </div>
                <StatusBadge status={tx.status} />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
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
                <Link to="/dashboard" search={{ tab: "wallets" }}>
                  <Wallet className="size-4" /> View wallets
                </Link>
              </Button>
            </div>
          </Card>
          <Card>
            <h3 className="font-fraunces text-base font-semibold">System status</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">API status</span>
                <span className="flex items-center gap-2 text-primary">
                  <span className="size-2 animate-pulse rounded-full bg-primary" />
                  Operational
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Uptime (90d)</span>
                <span>99.99%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg response</span>
                <span>84ms</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>(API_KEYS);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<string[]>(["payments:read"]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const create = () => {
    const id = `key_${Date.now()}`;
    setKeys((k) => [
      {
        id,
        name: name.trim() || "Untitled key",
        key: `cmp_live_sk_${Math.random().toString(16).slice(2, 10)}${Math.random()
          .toString(16)
          .slice(2, 10)}`,
        status: "active",
        permissions: perms.length ? perms : ["payments:read"],
        created: "Just now",
        lastUsed: "Never",
      },
      ...k,
    ]);
    setModal(false);
    setName("");
    setPerms(["payments:read"]);
  };

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

      <div className="space-y-4">
        {keys.map((k) => (
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
                  Created {k.created} · Last used {k.lastUsed}
                </p>
              </div>
              <div className="flex gap-2">
                {k.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setKeys((all) =>
                        all.map((x) => (x.id === k.id ? { ...x, status: "revoked" } : x)),
                      )
                    }
                  >
                    Revoke
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete key"
                  className="text-destructive"
                  onClick={() => setKeys((all) => all.filter((x) => x.id !== k.id))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-fraunces text-base font-semibold">API documentation</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Read the quickstart, webhook signatures and OpenAPI schema.
        </p>
        <Button variant="outline" className="mt-4">
          Open docs
        </Button>
      </Card>

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
                      setPerms((cur) =>
                        checked ? [...cur, p] : cur.filter((x) => x !== p),
                      )
                    }
                  />
                  <span className="font-mono text-xs">{p}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" onClick={create}>
                Create key
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

function PaymentsTab() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      TRANSACTIONS.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          `${t.currency} ${t.network} ${t.hash}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, status],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-fraunces text-xl font-bold">Transactions</h2>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button className="gap-2">
            <ArrowUpRight className="size-4" /> Send crypto
          </Button>
        </div>
      </div>

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
                      t.type === "incoming" ? "text-primary" : "text-accent",
                    )}
                  >
                    {t.type === "incoming" ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                    {t.type}
                  </span>
                </td>
                <td className="p-4">
                  {t.amount} {t.currency}
                </td>
                <td className="p-4 text-muted-foreground">{t.network}</td>
                <td className="p-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="p-4 text-muted-foreground">{t.date}</td>
                <td className="p-4 font-mono text-xs text-muted-foreground">{t.hash}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No transactions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoicesTab() {
  const paid = INVOICES.filter((i) => i.status === "paid").length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-fraunces text-xl font-bold">Invoices</h2>
        <Button className="gap-2">
          <Plus className="size-4" /> Create invoice
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: INVOICES.length },
          { label: "Paid", value: paid },
          { label: "Pending", value: INVOICES.length - paid },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-fraunces text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/90 backdrop-blur-xl">
        {INVOICES.map((inv, i) => (
          <div
            key={inv.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 p-5",
              i > 0 && "border-t border-border",
            )}
          >
            <div>
              <p className="font-mono text-sm">{inv.id}</p>
              <p className="text-xs text-muted-foreground">{inv.customer}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span>{inv.amount}</span>
              <StatusBadge status={inv.status} />
              <span className="text-muted-foreground">{inv.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-fraunces text-xl font-bold">Wallets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Non-custodial balances across your connected chains.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WALLETS.map((w) => (
          <Card key={w.symbol}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted p-1.5">
                <img
                  src={`/assets/${w.symbol === "MATIC" ? "pol" : w.symbol.toLowerCase()}.png`}
                  alt=""
                  className="size-full object-contain"
                />
              </span>
              <div>
                <p className="text-sm font-medium">{w.chain}</p>
                <p className="text-xs text-muted-foreground">{w.symbol}</p>
              </div>
            </div>
            <p className="mt-4 font-fraunces text-xl font-bold">
              {w.balance} {w.symbol}
            </p>
            <p className="text-sm text-muted-foreground">{w.usd}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Bars({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <Card>
      <h3 className="font-fraunces text-base font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{d.label}</span>
              <span>{d.value}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: d.color ?? "var(--primary)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Revenue", value: "$24,892" },
          { label: "Avg Transaction", value: "$168.30" },
          { label: "Total Transactions", value: "1,482" },
          { label: "Success Rate", value: "99.2%" },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-fraunces text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-fraunces text-base font-semibold">Revenue over time</h3>
        <div className="mt-4 flex h-56 items-end gap-2">
          {[38, 52, 44, 61, 57, 72, 66, 81, 74, 89, 83, 96].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-lg bg-primary/70 transition-colors hover:bg-primary"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bars
          title="Top coins by volume"
          data={[
            { label: "USDT", value: 42, color: "#26A17B" },
            { label: "BTC", value: 27, color: "#F7931A" },
            { label: "ETH", value: 18, color: "#627EEA" },
            { label: "USDC", value: 9, color: "#2775CA" },
            { label: "SOL", value: 4, color: "#9945FF" },
          ]}
        />
        <Bars
          title="Network distribution"
          data={[
            { label: "TRON", value: 36, color: "#FF0013" },
            { label: "Ethereum", value: 28, color: "#627EEA" },
            { label: "BSC", value: 17, color: "#F0B90B" },
            { label: "Bitcoin", value: 12, color: "#F7931A" },
            { label: "Polygon", value: 7, color: "#8247E5" },
          ]}
        />
      </div>
    </div>
  );
}

function SettingsTab({ user }: { user: CoscomUser }) {
  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <h3 className="font-fraunces text-base font-semibold">Profile</h3>
        <div className="mt-5 flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary">
            {initials(user.name)}
          </span>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" defaultValue={user.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" defaultValue={user.email} />
          </div>
        </div>
        <Button className="mt-5">Save changes</Button>
      </Card>

      <Card>
        <h3 className="font-fraunces text-base font-semibold">Webhooks</h3>
        <div className="mt-4 space-y-2">
          {["https://api.acme.com/hooks/coscompay", "https://staging.acme.com/hooks"].map(
            (url) => (
              <div
                key={url}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <code className="truncate font-mono text-xs">{url}</code>
                <StatusBadge status="active" />
              </div>
            ),
          )}
        </div>
        <Button variant="outline" className="mt-4 gap-2">
          <Plus className="size-4" /> Add webhook
        </Button>
      </Card>

      <Card>
        <h3 className="font-fraunces text-base font-semibold">Notifications</h3>
        <div className="mt-4 space-y-4">
          {["Payment confirmed", "Payment failed", "Weekly settlement summary"].map(
            (label, i) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Switch defaultChecked={i < 2} />
              </div>
            ),
          )}
        </div>
      </Card>

      <Card className="border-destructive/40">
        <h3 className="font-fraunces text-base font-semibold text-destructive">
          Danger zone
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Deleting your account removes all API keys, invoices and settlement history.
        </p>
        <Separator className="my-4" />
        <Button variant="destructive">Delete account</Button>
      </Card>
    </div>
  );
}
