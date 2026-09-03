/**
 * CosComPay JavaScript SDK (v1)
 * Server-side use only — an API key must never ship in browser code.
 *
 *   import { CosComPay } from "https://coscomai.xyz/sdk/coscompay.js";
 *   const pay = new CosComPay(process.env.COSCOMPAY_API_KEY);
 *   const charge = await pay.createPayment({ amount_usd: 49.99, asset: "BEP20-USDT" });
 *   // redirect the buyer to charge.checkout_url
 */

export const COSCOMPAY_BASE_URL = "https://coscomai.xyz/api/public/v1";

export class CosComPayError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "CosComPayError";
    this.status = status;
  }
}

export class CosComPay {
  constructor(apiKey, options = {}) {
    if (!apiKey) throw new CosComPayError("An API key is required", 0);
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl || COSCOMPAY_BASE_URL).replace(/\/$/, "");
  }

  async #request(path, init = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
        ...(init.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new CosComPayError(body.error || `Request failed (${res.status})`, res.status);
    return body;
  }

  /** Create a crypto charge and get a hosted checkout URL. */
  createPayment(input) {
    return this.#request("/payments", { method: "POST", body: JSON.stringify(input) });
  }

  /** Fetch the live status of a charge by reference. */
  getPayment(reference) {
    return this.#request(`/payments/${encodeURIComponent(reference)}`);
  }

  /** Verify a webhook delivery: HMAC-SHA256 of the raw body with your webhook secret. */
  static async verifyWebhook(rawBody, signatureHeader, webhookSecret) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
    const expected = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (expected.length !== (signatureHeader || "").length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }
    return diff === 0;
  }
}

export default CosComPay;
