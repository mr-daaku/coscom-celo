import { Link } from "@tanstack/react-router";
import { Github, Linkedin, MessageCircle, Twitter } from "lucide-react";

import logo from "@/assets/logo.png";
import { APP_VERSION } from "@/lib/version";

const COLUMNS = [
  {
    title: "Product",
    links: ["Checkout", "Invoices", "Wallets", "Settlement", "Pricing"],
  },
  {
    title: "Developers",
    links: ["Documentation", "API reference", "Webhooks", "Sandbox", "Status"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Security", "Privacy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt="CosComPay logo"
                width={32}
                height={32}
                loading="lazy"
                className="size-8 rounded-xl"
              />
              <span className="font-fraunces text-lg font-bold">CosComPay</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The gateway to crypto commerce. Accept 50+ cryptocurrencies with one
              integration.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-fraunces text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CosComPay. All rights reserved. · v{APP_VERSION}
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            {[Github, Twitter, MessageCircle, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="flex size-9 items-center justify-center rounded-xl border border-border transition-colors hover:border-primary hover:text-primary"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
