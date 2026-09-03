import { createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "@/components/site/AuthForm";

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
  return <AuthForm mode="signup" />;
}
