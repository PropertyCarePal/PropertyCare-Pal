"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setResetLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Password reset email sent. Please check your inbox."
    );
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to PropertyCare Pal"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">
              Password
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              {resetLoading ? "Sending..." : "Forgot password?"}
            </button>
          </div>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">
            {error}
          </p>
        )}

        {message && (
          <p className="text-emerald-700 text-sm">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-3 text-white"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}