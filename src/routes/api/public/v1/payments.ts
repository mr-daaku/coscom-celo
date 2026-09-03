import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-api-key",
  "access-control-max-age": "86400",
};

const bodySchema = z.object({
  amount_usd: z.number().positive().max(1_000_000),
  coin: z.string().trim().min(2).max(10),
  chain: z.string().trim().min(2).max(20),
  description: z.string().trim().max(200).optional(),
  customer_email: z.string().trim().email().max(120).optional(),
  metadata: z.record(z.string(), z.string().max(200)).optional(),
});

export const Route = createFileRoute("/api/public/v1/payments")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const g = await import("@/lib/gateway.server");
        const withCors = (res: Response) => {
          const headers = new Headers(res.headers);
          Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
          return new Response(res.body, { status: res.status, headers });
        };

        const auth = await g.authenticateApiKey(request);
        if (!auth.ok) return withCors(auth.response);
        if (!auth.key.permissions.includes("payments:write")) {
          return withCors(g.json({ error: "API key lacks payments:write permission" }, 403));
        }

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return withCors(g.json({ error: "Invalid request body" }, 400));
        }

        try {
          const { createPaymentRecord } = await import("@/lib/gateway.functions");
          const payment = (await createPaymentRecord(g, auth.key.user_id, parsed)) as Record<string, unknown>;
          const origin = new URL(request.url).origin;
          return withCors(
            g.json(
              {
                id: payment["id"],
                reference: payment["reference"],
                amount_usd: payment["amount_usd"],
                coin: payment["coin"],
                chain: payment["chain"],
                crypto_amount: payment["crypto_amount"],
                deposit_address: payment["deposit_address"],
                status: payment["status"],
                expires_at: payment["expires_at"],
                checkout_url: `${origin}/pay?ref=${String(payment["reference"])}`,
              },
              201,
            ),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to create payment";
          return withCors(g.json({ error: message }, 400));
        }
      },
    },
  },
});
