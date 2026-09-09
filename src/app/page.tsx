"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { getSupabaseClient } from "@/lib/supabase";

type WorkOrder = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  completed_at: string | null;
};

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = getSupabaseClient();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadWorkOrders() {
      if (!user) return;

      setLoadingWorkOrders(true);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        console.error("DASHBOARD PROFILE ERROR:", profileError);
        setLoadingWorkOrders(false);
        return;
      }

      const { data, error } = await supabase
        .from("work_orders")
        .select(
          "id, title, status, priority, due_date, completed_at"
        )
        .eq("organization_id", profile.organization_id)
        .order("due_date", { ascending: true });

      if (error) {
        console.error("DASHBOARD WORK ORDERS ERROR:", error);
        setLoadingWorkOrders(false);
        return;
      }

      setWorkOrders(data ?? []);
      setLoadingWorkOrders(false);
    }

    loadWorkOrders();
  }, [user, supabase]);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activeWorkOrders = workOrders.filter(
    (workOrder) =>
      workOrder.status !== "Completed" &&
      workOrder.status !== "Cancelled"
  );

  const overdueWorkOrders = activeWorkOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;

    const dueDate = new Date(`${workOrder.due_date}T00:00:00`);
    return dueDate < today;
  });

  const dueSoonWorkOrders = activeWorkOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;

    const dueDate = new Date(`${workOrder.due_date}T00:00:00`);

    return dueDate >= today && dueDate <= sevenDaysFromNow;
  });

  const recentlyCompletedWorkOrders = workOrders.filter((workOrder) => {
    if (workOrder.status !== "Completed" || !workOrder.completed_at) {
      return false;
    }

    const completedDate = new Date(workOrder.completed_at);

    return (
      completedDate >= sevenDaysAgo &&
      completedDate <= new Date()
    );
  });

  function formatDate(dateString: string | null) {
    if (!dateString) return "No due date";

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatCompletedDate(dateString: string | null) {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
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
            <p className="text-gray-500">
              Active properties managed
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Service Requests</h2>
            <p className="mt-4 text-4xl font-bold">
              {activeWorkOrders.length}
            </p>
            <p className="text-gray-500">
              Active maintenance items
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Assets</h2>
            <p className="mt-4 text-4xl font-bold">156</p>
            <p className="text-gray-500">
              Tracked property assets
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Maintenance Overview
          </h2>

          {loadingWorkOrders ? (
            <div className="rounded-xl bg-white p-6 shadow">
              <p className="text-gray-500">
                Loading maintenance activity...
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-red-700">
                    Overdue
                  </h3>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    {overdueWorkOrders.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {overdueWorkOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No overdue work orders.
                    </p>
                  ) : (
                    overdueWorkOrders.slice(0, 5).map((workOrder) => (
                      <button
                        key={workOrder.id}
                        type="button"
                        onClick={() =>
                          router.push(`/work-orders/${workOrder.id}`)
                        }
                        className="block w-full rounded-lg border border-red-100 bg-red-50 p-3 text-left hover:bg-red-100"
                      >
                        <p className="font-semibold text-gray-900">
                          {workOrder.title}
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                          Due {formatDate(workOrder.due_date)}
                        </p>

                        {workOrder.priority && (
                          <p className="mt-1 text-xs text-gray-500">
                            Priority: {workOrder.priority}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-orange-700">
                    Due Soon
                  </h3>

                  <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                    {dueSoonWorkOrders.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {dueSoonWorkOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Nothing due in the next 7 days.
                    </p>
                  ) : (
                    dueSoonWorkOrders.slice(0, 5).map((workOrder) => (
                      <button
                        key={workOrder.id}
                        type="button"
                        onClick={() =>
                          router.push(`/work-orders/${workOrder.id}`)
                        }
                        className="block w-full rounded-lg border border-orange-100 bg-orange-50 p-3 text-left hover:bg-orange-100"
                      >
                        <p className="font-semibold text-gray-900">
                          {workOrder.title}
                        </p>

                        <p className="mt-1 text-sm text-orange-700">
                          Due {formatDate(workOrder.due_date)}
                        </p>

                        {workOrder.priority && (
                          <p className="mt-1 text-xs text-gray-500">
                            Priority: {workOrder.priority}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-green-700">
                    Recently Completed
                  </h3>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    {recentlyCompletedWorkOrders.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {recentlyCompletedWorkOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No work orders completed in the last 7 days.
                    </p>
                  ) : (
                    recentlyCompletedWorkOrders
                      .slice(0, 5)
                      .map((workOrder) => (
                        <button
                          key={workOrder.id}
                          type="button"
                          onClick={() =>
                            router.push(`/work-orders/${workOrder.id}`)
                          }
                          className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left hover:bg-gray-100"
                        >
                          <p className="font-semibold text-gray-700">
                            {workOrder.title}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Completed{" "}
                            {formatCompletedDate(
                              workOrder.completed_at
                            )}
                          </p>
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => router.push("/properties")}
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              Add Property
            </button>

            <button
              type="button"
              onClick={() => router.push("/work-orders")}
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              Create Work Order
            </button>

            <button
              type="button"
              onClick={() => router.push("/assets")}
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              View Assets
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}