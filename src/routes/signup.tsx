import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthCard } from "@/components/site/AuthCard";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your CosComPay account — Accept Crypto" },
      {
        name: "description",
        content:
          "Create a CosComPay merchant account and start accepting Bitcoin, Ethereum and stablecoins in minutes.",
      },
      { property: "og:title", content: "Create your CosComPay account" },
      {
        property: "og:description",
        content: "Start accepting crypto payments in minutes with CosComPay.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Deploy your first Worker in minutes"
      action="Sign up with Google"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    />
  );
}
