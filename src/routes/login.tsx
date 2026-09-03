import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthCard } from "@/components/site/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CosComPay Crypto Payment Gateway" },
      {
        name: "description",
        content:
          "Sign in to your CosComPay merchant dashboard to manage crypto payments, API keys, invoices and wallets.",
      },
      { property: "og:title", content: "Sign in — CosComPay" },
      {
        property: "og:description",
        content: "Access your CosComPay merchant dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your merchant dashboard"
      action="Continue with Google"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    />
  );
}
