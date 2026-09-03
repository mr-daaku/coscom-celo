/**
 * Sends mail from otp.coscom@gmail.com over Gmail SMTP using a Google
 * App Password. The production runtime has no Node `net` module, so this uses
 * worker-mailer, which speaks SMTP over the Worker TCP socket API
 * (`cloudflare:sockets`). That module only exists in the deployed runtime, so
 * it is imported lazily — local dev cannot open SMTP and reports it clearly.
 */

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const user = process.env["GMAIL_USER"];
  const pass = process.env["GMAIL_APP_PASSWORD"];

  if (!user || !pass) {
    return { sent: false, error: "Email sending is not configured yet." };
  }

  try {
    const { WorkerMailer } = await import("worker-mailer");
    const mailer = await WorkerMailer.connect({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      credentials: { username: user, password: pass.replace(/\s+/g, "") },
      authType: "plain",
    });

    await mailer.send({
      from: { name: "CosComPay", email: user },
      to: { email: opts.to },
      subject: opts.subject,
      html: opts.html,
    });

    await mailer.close();
    return { sent: true, error: null as string | null };
  } catch (error) {
    console.error("Gmail SMTP send failed", error);
    return { sent: false, error: "Could not send the email. Please try again." };
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
