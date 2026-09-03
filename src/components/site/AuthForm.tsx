import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { SpotlightBackground } from "@/components/SpotlightBackground";
import { Turnstile } from "@/components/site/Turnstile";
import logo from "@/assets/logo.png";
import { verifyCaptcha } from "@/lib/captcha.functions";
import {
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";


function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.1 17.6 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.6h12.8c-.3 2.1-1.7 5.2-4.9 7.3l7.6 5.9c4.5-4.2 7-10.3 7-17.7Z"
      />
      <path
        fill="#FBBC05"
        d="M10.3 28.6a14.7 14.7 0 0 1 0-9.2l-7.8-6.1a24 24 0 0 0 0 21.4l7.8-6.1Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.5-2 15.5-5.8l-7.6-5.9c-2 1.4-4.8 2.4-7.9 2.4-6.4 0-11.8-3.6-13.7-8.9l-7.8 6.1C6.4 42.6 14.6 48 24 48Z"
      />
    </svg>
  );
}

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-sm text-destructive">
      <AlertCircle className="size-3.5" />
      {children}
    </p>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const generateCaptcha = useCallback(() => {
    let out = "";
    for (let i = 0; i < 6; i += 1) {
      out += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
    }
    setCaptchaText(out);
    setCaptcha("");
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (isSignup && fullName.trim().length < 2) next["fullName"] = "Full name is required";
    if (!email.trim()) next["email"] = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next["email"] = "Invalid email format";
    if (!password) next["password"] = "Password is required";
    else if (isSignup && password.length < 8)
      next["password"] = "Use at least 8 characters";
    if (!captcha) next["captcha"] = "Please enter the captcha";
    else if (captcha.toLowerCase() !== captchaText.toLowerCase())
      next["captcha"] = "Invalid captcha";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!validate()) return;

    setBusy(true);
    if (isSignup) {
      const { error, needsConfirmation } = await signUpWithEmail(
        email.trim(),
        password,
        fullName.trim(),
      );
      setBusy(false);
      if (error) {
        generateCaptcha();
        setErrors({ form: error.message });
        return;
      }
      if (needsConfirmation) {
        setNotice(
          "Account created. Check your inbox and confirm your email to sign in.",
        );
        return;
      }
    } else {
      const { error } = await signInWithEmail(email.trim(), password);
      setBusy(false);
      if (error) {
        generateCaptcha();
        setErrors({ form: error.message });
        return;
      }
    }
    void navigate({ to: "/dashboard", search: { tab: "overview" } });
  };

  const startGoogle = async () => {
    setGoogleBusy(true);
    setErrors({});
    setNotice(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setErrors({ form: result.error.message });
      setGoogleBusy(false);
    }
  };

  const forgot = async () => {
    setNotice(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Enter your email first" });
      return;
    }
    const { error } = await resetPassword(email.trim());
    if (error) setErrors({ form: error.message });
    else setNotice("Password reset link sent. Check your inbox.");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <SpotlightBackground />
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <div className="animate-scale-in rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="CosComPay logo"
              width={40}
              height={40}
              loading="lazy"
              className="size-10 rounded-xl"
            />
            <span className="font-fraunces text-lg font-bold">CosComPay</span>
          </div>

          <h1 className="mt-7 font-fraunces text-2xl font-bold tracking-tight sm:text-3xl">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Start accepting crypto in minutes"
              : "Sign in to your merchant dashboard"}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {isSignup && (
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    placeholder="Alex Merchant"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  />
                </div>
                {errors["fullName"] && <FieldError>{errors["fullName"]}</FieldError>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>
              {errors["email"] && <FieldError>{errors["email"]}</FieldError>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors["password"] && <FieldError>{errors["password"]}</FieldError>}
            </div>

            <div>
              <label htmlFor="captcha" className="mb-2 block text-sm font-medium">
                Security check
              </label>
              <div className="flex items-center gap-2">
                <span className="select-none rounded-xl border border-border bg-muted px-4 py-3 font-mono text-base tracking-[0.35em] text-foreground">
                  {captchaText}
                </span>
                <button
                  type="button"
                  aria-label="Refresh captcha"
                  onClick={generateCaptcha}
                  className="rounded-xl border border-border p-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RefreshCw className="size-4" />
                </button>
                <input
                  id="captcha"
                  name="captcha"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Type the code"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>
              {errors["captcha"] && <FieldError>{errors["captcha"]}</FieldError>}
            </div>

            {!isSignup && (
              <button
                type="button"
                onClick={() => void forgot()}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}

            {errors["form"] && <FieldError>{errors["form"]}</FieldError>}
            {notice && <p className="text-sm text-primary">{notice}</p>}

            <Button type="submit" className="h-12 w-full" disabled={busy}>
              {busy
                ? isSignup
                  ? "Creating account…"
                  : "Signing in…"
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="h-12 w-full gap-3 bg-white text-[#1f1f1f] hover:bg-white/90"
            disabled={googleBusy}
            onClick={() => void startGoogle()}
          >
            <GoogleMark />
            {googleBusy
              ? "Redirecting…"
              : isSignup
                ? "Sign up with Google"
                : "Continue with Google"}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to our Terms of Service and acknowledge our Privacy
            Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
