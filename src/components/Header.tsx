"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b bg-white px-8 py-5 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="text-sm text-gray-500">
          Welcome back to PropertyCare Pal
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="font-medium text-gray-900">
            {user?.email}
          </p>

          <p className="text-sm text-gray-500">
            Administrator
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}