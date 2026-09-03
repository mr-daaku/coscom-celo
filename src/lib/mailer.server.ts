/**
 * Sends mail from the connected Gmail account (otp.coscom@gmail.com) through
 * the Lovable connector gateway — Workers cannot open SMTP connections, so the
 * Gmail HTTP API is used instead of an app password.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));

const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

function rawEmail(opts: { to: string; subject: string; html: string; from: string }) {
  const message = [
    `From: ${header("CosComPay")} <${opts.from}>`,
    `To: ${opts.to}`,
    `Subject: ${header(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    opts.html,
  ].join("\r\n");
  return b64(message).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_MAIL_API_KEY"];
  const from = process.env["GMAIL_USER"] ?? "otp.coscom@gmail.com";

  if (!lovableKey || !connectionKey) {
    return { sent: false, error: "Email sending is not connected yet." };
  }

  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw: rawEmail({ ...opts, from }) }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Gmail send failed [${res.status}]: ${body}`);
    return { sent: false, error: "Could not send the email. Please try again." };
  }
  return { sent: true, error: null as string | null };
}

export function emailShell(opts: {
  heading: string;
  intro: string;
  buttonLabel: string;
  url: string;
  footer: string;
}) {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Inter,Arial,sans-serif;color:#0e1111">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="font-size:20px;font-weight:700;margin:0 0 24px">CosComPay</p>
    <h1 style="font-size:22px;margin:0 0 12px">${opts.heading}</h1>
    <p style="font-size:15px;line-height:1.6;color:#3f4747;margin:0 0 24px">${opts.intro}</p>
    <p style="margin:0 0 28px">
      <a href="${opts.url}" style="display:inline-block;background:#a3e635;color:#0b0b0f;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:12px">${opts.buttonLabel}</a>
    </p>
    <p style="font-size:13px;color:#6b7373;line-height:1.6;margin:0 0 8px">${opts.footer}</p>
    <p style="font-size:12px;color:#9ba39e;word-break:break-all;margin:0">${opts.url}</p>
  </div></body></html>`;
}
