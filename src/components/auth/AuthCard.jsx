"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { signIn, signUp } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

const messageFor = (error) => {
  const code = error?.code || "";
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "That email and password don't match.";
  if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") return "An account with that email already exists. Try logging in.";
  if (code === "PASSWORD_TOO_SHORT") return "Use at least 8 characters for your password.";
  return error?.message || "Something went wrong. Please try again.";
};

export default function AuthCard({ initialMode, next, googleEnabled, demos, demoPassword }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [demoEmail, setDemoEmail] = useState(demos[0]?.email || "");

  const finish = (message) => {
    toast.success(message);
    router.replace(next);
    router.refresh();
  };

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email").toString().trim();
    const password = form.get("password").toString();
    setError("");
    setBusy("form");

    const { error: authError } =
      mode === "signup"
        ? await signUp.email({ name: form.get("name").toString().trim(), email, password })
        : await signIn.email({ email, password });

    if (authError) {
      setError(messageFor(authError));
      setBusy(null);
      return;
    }
    finish(mode === "signup" ? "Welcome to Vendora!" : "Welcome back!");
  };

  const demoLogin = async () => {
    setError("");
    setBusy("demo");
    const { error: authError } = await signIn.email({ email: demoEmail, password: demoPassword });
    if (authError) {
      setError("The demo account isn't set up yet. Run `npm run seed` first.");
      setBusy(null);
      return;
    }
    const role = demos.find((d) => d.email === demoEmail)?.role;
    const landing = role === "Rider" ? "/rider" : role === "Admin" ? "/admin" : next;
    toast.success(`Exploring as the demo ${role?.toLowerCase()}`);
    router.replace(landing);
    router.refresh();
  };

  const google = async () => {
    setBusy("google");
    const { error: authError } = await signIn.social({ provider: "google", callbackURL: next });
    if (authError) {
      setError(messageFor(authError));
      setBusy(null);
    }
  };

  const switchMode = (value) => {
    setMode(value);
    setError("");
  };

  return (
    <div className="w-full max-w-[440px] card !rounded-[28px] p-6 sm:p-8 shadow-lg fade-up">
      <h2 className="text-2xl font-semibold tracking-tight">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
      <p className="mt-1.5 text-sm text-text-2">
        {mode === "signup" ? "Shop every store with one account." : "Log in to see your cart, orders and deliveries."}
      </p>

      <div className="segmented w-full mt-6" role="group" aria-label="Choose log in or sign up">
        <button type="button" className="flex-1" aria-pressed={mode === "login"} onClick={() => switchMode("login")}>
          Log in
        </button>
        <button type="button" className="flex-1" aria-pressed={mode === "signup"} onClick={() => switchMode("signup")}>
          Sign up
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3 pointer-events-none" />
              <input id="name" name="name" className="input !pl-10" placeholder="Alex Rivera" autoComplete="name" required minLength={2} />
            </div>
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3 pointer-events-none" />
            <input id="email" name="email" type="email" className="input !pl-10" placeholder="you@example.com" autoComplete="email" required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3 pointer-events-none" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className="input !pl-10 !pr-12"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon btn-sm"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-[12px] px-3.5 py-2.5 text-sm bg-[rgba(244,63,94,.1)] text-danger border border-[rgba(244,63,94,.25)]">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={Boolean(busy)}>
          {busy === "form" ? <span className="spinner" /> : null}
          {mode === "signup" ? "Create account" : "Log in"}
          {busy !== "form" && <ArrowRight />}
        </button>
      </form>

      {(googleEnabled || demos.length > 0) && (
        <div className="my-6 flex items-center gap-3 text-xs text-text-3">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      <div className="space-y-3">
        {googleEnabled && (
          <button className="btn btn-secondary btn-lg btn-block" onClick={google} disabled={Boolean(busy)}>
            {busy === "google" ? <span className="spinner" /> : <GoogleIcon />}
            Continue with Google
          </button>
        )}
        {demos.length > 0 && (
          <div className="rounded-[20px] border border-dashed border-border-strong p-3">
            {demos.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3" role="radiogroup" aria-label="Demo role">
                {demos.map((d) => (
                  <button key={d.email} type="button" role="radio" aria-checked={demoEmail === d.email} className="chip !h-8 !text-xs" data-active={demoEmail === d.email} onClick={() => setDemoEmail(d.email)}>
                    {d.role}
                  </button>
                ))}
              </div>
            )}
            <button className="btn btn-secondary btn-block" onClick={demoLogin} disabled={Boolean(busy)}>
              {busy === "demo" ? <span className="spinner" /> : <Wand2 />}
              Explore with a demo account
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-text-3">
        {mode === "signup" ? "Already shopping with us? " : "New to Vendora? "}
        <button className="text-accent-text font-medium hover:underline" onClick={() => switchMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Log in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}
