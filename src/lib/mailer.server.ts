/**
 * Sends mail from otp.coscom@gmail.com over Gmail SMTP using a Google
 * App Password. The production runtime has no Node `net` module, so this uses
 * worker-mailer, which speaks SMTP over the Worker TCP socket API
 * (`cloudflare:sockets`). That module only exists in the deployed runtime, so
 * it is imported lazily — local dev cannot open SMTP and reports it clearly.
 */

type SendResult = { sent: boolean; error: string | null };

async function smtpSend(
  opts: { to: string; subject: string; html: string },
  creds: { user: string; pass: string },
  port: 587 | 465,
) {
  const { WorkerMailer } = await import("worker-mailer");
  const mailer = await WorkerMailer.connect({
    host: "smtp.gmail.com",
    port,
    secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
    credentials: { username: creds.user, password: creds.pass },
    authType: "plain",
  });

  try {
    await mailer.send({
      from: { name: "CosComPay", email: creds.user },
      to: { email: opts.to },
      subject: opts.subject,
      html: opts.html,
      text: opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
  } finally {
    await mailer.close().catch(() => undefined);
  }
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const user = process.env["GMAIL_USER"];
  const pass = process.env["GMAIL_APP_PASSWORD"]?.replace(/\s+/g, "");

  if (!user || !pass) {
    return { sent: false, error: "Email sending is not configured yet." };
  }

  // Gmail accepts STARTTLS on 587; some runtimes only allow implicit TLS on 465.
  for (const port of [587, 465] as const) {
    try {
      await smtpSend(opts, { user, pass }, port);
      return { sent: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Gmail SMTP send failed on port ${port}`, error);
      if (/cloudflare:sockets/.test(message)) {
        // Local Node dev has no Worker TCP sockets — surface the link in the log
        // so the flow stays testable; the deployed Worker sends for real.
        const link = /href="([^"]+)"/.exec(opts.html)?.[1];
        console.warn(`[dev mail] to=${opts.to} subject=${opts.subject} link=${link}`);
        return { sent: true, error: null };
      }
      if (/credential|auth|535|534/i.test(message)) {
        return {
          sent: false,
          error: "The email account rejected the app password. Please check GMAIL_APP_PASSWORD.",
        };
      }
    }
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
