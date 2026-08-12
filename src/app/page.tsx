"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            PropertyCare Pal
          </h1>
          <p className="mt-2 text-gray-600">
            Property maintenance management made simple.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Properties</h2>
            <p className="mt-4 text-4xl font-bold">24</p>
            <p className="text-gray-500">Active properties managed</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Service Requests</h2>
            <p className="mt-4 text-4xl font-bold">8</p>
            <p className="text-gray-500">Pending maintenance items</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Assets</h2>
            <p className="mt-4 text-4xl font-bold">156</p>
            <p className="text-gray-500">Tracked property assets</p>
          </div>
        </section>

        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>

          <div className="flex flex-wrap gap-4">
            <button className="rounded-lg bg-black px-5 py-3 text-white">
              Add Property
            </button>

            <button className="rounded-lg bg-black px-5 py-3 text-white">
              Create Work Order
            </button>

            <button className="rounded-lg bg-black px-5 py-3 text-white">
              View Assets
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}