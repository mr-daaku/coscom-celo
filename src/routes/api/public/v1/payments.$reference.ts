import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-api-key",
};

export const Route = createFileRoute("/api/public/v1/payments/$reference")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request, params }) => {
        const g = await import("@/lib/gateway.server");
        const withCors = (res: Response) => {
          const headers = new Headers(res.headers);
          Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
          return new Response(res.body, { status: res.status, headers });
        };

        const auth = await g.authenticateApiKey(request);
        if (!auth.ok) return withCors(auth.response);
        if (!/^cos_[a-z0-9]{6,32}$/.test(params.reference)) {
          return withCors(g.json({ error: "Invalid reference" }, 400));
        }

        const client = await g.admin();
        const { data } = await g
          .table(client, "payments")
          .select(
            "id, reference, amount_usd, coin, chain, crypto_amount, deposit_address, fee_usd, net_usd, status, tx_hash, confirmations, expires_at, paid_at, created_at",
          )
          .eq("reference", params.reference)
          .eq("user_id", auth.key.user_id)
          .maybeSingle();

        if (!data) return withCors(g.json({ error: "Payment not found" }, 404));
        return withCors(g.json(data));
      },
    },
  },
});
