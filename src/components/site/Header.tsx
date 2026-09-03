import { Link } from "@tanstack/react-router";
import { Menu, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readUser, type CoscomUser } from "@/lib/coscom";

const NAV = [
  { label: "Features", href: "/#features" },
  { label: "Demo", href: "/#checkout" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<CoscomUser | null>(null);

  useEffect(() => {
    setUser(readUser());
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors",
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          <span className="font-fraunces text-lg font-bold tracking-tight">CosComPay</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
          {NAV.map((item) => (
            <a key={item.label} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
          <Link to="/workers" className="transition-colors hover:text-foreground">
            Workers
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button asChild className="transition-transform hover:scale-[1.02]">
              <Link to="/dashboard" search={{ tab: "overview" }}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="transition-transform hover:scale-[1.02]">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {open && (
        <div className="animate-slide-down border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/workers"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Workers
            </Link>
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <Button asChild>
                  <Link to="/dashboard" search={{ tab: "overview" }}>Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
