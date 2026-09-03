import { createServerFn } from "@tanstack/react-start";

export const signUpAccount = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      email: string;
      password: string;
      fullName: string;
      captchaToken: string;
      origin: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { verifyTurnstileToken } = await import("./captcha.server");
    await verifyTurnstileToken(data.captchaToken);

    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Invalid email address." };
    if (data.password.length < 8) return { error: "Use at least 8 characters." };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { issueToken, safeOrigin, sendActivationMail } = await import("./account.server");

      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: false,
        user_metadata: { full_name: data.fullName.trim() },
      });

      if (created.error || !created.data.user) {
        if (/already|registered|exists/i.test(created.error?.message ?? "")) {
          return { error: "An account with this email already exists. Try signing in." };
        }
        console.error("createUser failed", created.error?.message);
        return { error: created.error?.message ?? "Could not create your account." };
      }

      const token = await issueToken(supabaseAdmin, {
        userId: created.data.user.id,
        email,
        purpose: "verify",
      });

      const url = `${safeOrigin(data.origin)}/verify-email?token=${token}`;
      const mail = await sendActivationMail({
        to: email,
        url,
        name: data.fullName.trim().split(" ")[0] ?? "there",
      });
      if (!mail.sent) return { error: mail.error ?? "Could not send the activation email." };

      return { error: null as string | null };
    } catch (error) {
      console.error("signup crashed", error);
      const message = error instanceof Error ? error.message : String(error);
      return {
        error: /Missing Supabase environment/i.test(message)
          ? "This deployment is missing its backend keys (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY). Add them to the Worker environment and redeploy."
          : "Could not create your account. Please try again.",
      };
    }
  });


export const activateAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { consumeToken } = await import("./account.server");

    const { error, row } = await consumeToken(supabaseAdmin, {
      token: data.token,
      purpose: "verify",
    });
    if (error || !row) return { error: error ?? "This link is invalid." };

    const updated = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
      email_confirm: true,
    });
    if (updated.error) {
      console.error("activate failed", updated.error.message);
      return { error: "Could not activate your account." };
    }
    return { error: null as string | null };
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; captchaToken: string; origin: string }) => data)
  .handler(async ({ data }) => {
    const { verifyTurnstileToken } = await import("./captcha.server");
    const captcha = await verifyTurnstileToken(data.captchaToken);
    if (!captcha.ok) return { error: captcha.error ?? "Captcha check failed." };

    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { issueToken, safeOrigin, sendResetMail } = await import("./account.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    // Never disclose whether the address exists.
    if (profile?.id) {
      const token = await issueToken(supabaseAdmin, {
        userId: profile.id,
        email,
        purpose: "reset",
      });
      await sendResetMail({ to: email, url: `${safeOrigin(data.origin)}/reset-password?token=${token}` });
    }

    return { error: null as string | null };
  });

export const completePasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (data.password.length < 8) return { error: "Use at least 8 characters." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { consumeToken } = await import("./account.server");

    const { error, row } = await consumeToken(supabaseAdmin, {
      token: data.token,
      purpose: "reset",
    });
    if (error || !row) return { error: error ?? "This link is invalid." };

    const updated = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
      password: data.password,
      email_confirm: true,
    });
    if (updated.error) {
      console.error("reset failed", updated.error.message);
      return { error: "Could not update your password." };
    }
    return { error: null as string | null };
  });
