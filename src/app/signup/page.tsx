"use client";
import { supabase } from "@/lib/supabase";

import AuthShell from "@/components/AuthShell";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    setError("");
    setLoading(true);
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    setLoading(false);
  
    if (error) {
      setError(error.message);
      return;
    }
  
    setError(
      "Account created! Please check your email to verify your account."
    );
  }
   
  return (
    <AuthShell
      title="Create your account"
      subtitle="Get started with PropertyCare Pal in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a secure password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
  type="submit"
  disabled={loading}
  className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/30"
>
  {loading ? "Creating Account..." : "Create Account"}
</button>
      </form>
    </AuthShell>
  );
}




