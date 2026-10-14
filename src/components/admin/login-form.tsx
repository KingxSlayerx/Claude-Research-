"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/site/wordmark";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ sending: boolean; error?: string }>({ sending: false });
  const next = params.get("next");
  const target = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ sending: true });
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace(target);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setState({ sending: false, error: body.error ?? "Sign-in failed. Please try again." });
    } catch {
      setState({ sending: false, error: "Couldn't reach the server. Check your connection." });
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-ivory px-4">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-6 border border-line bg-paper p-8" aria-labelledby="login-title">
        <Wordmark />
        <div>
          <h1 id="login-title" className="font-display text-[2rem] leading-tight">
            Showroom sign-in
          </h1>
          <p className="mt-1 text-sm text-muted">For Threshold staff only.</p>
        </div>
        <Field id="email" label="Email">
          <TextInput id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label="Password">
          <TextInput id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {state.error && (
          <p role="alert" className="border-l-2 border-error bg-error-soft px-3 py-2 text-sm">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={state.sending} className="w-full">
          {state.sending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
