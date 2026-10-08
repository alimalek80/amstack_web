"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { dash, type DashUser } from "@/lib/dashboard";

function safeNext(value: string | null): string {
  return value && value.startsWith("/admin-dashboard") && !value.startsWith("//") ? value : "/admin-dashboard";
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Sets the CSRF cookie, and skips the form when already logged in.
  useEffect(() => {
    dash<DashUser>("/auth/me/")
      .then(() => router.replace(next))
      .catch(() => {});
  }, [router, next]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await dash("/auth/login/", {
        method: "POST",
        json: { email: form.get("email"), password: form.get("password") },
      });
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
      setBusy(false);
    }
  }

  return (
    <form className="dash-login-card" onSubmit={onSubmit}>
      <p className="dash-brand">
        amstack<span>.</span> <small>dashboard</small>
      </p>
      <h1>Log in</h1>
      <p className="dash-muted">Superuser accounts only.</p>
      <label className="dash-field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label className="dash-field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p className="dash-alert" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="dash-btn dash-btn-primary dash-btn-block" disabled={busy}>
        {busy ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="dash-login">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
