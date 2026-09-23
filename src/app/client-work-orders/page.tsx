"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import ClientSidebar from "@/components/ClientSidebar";

type WorkOrder = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  property_id: string;
};

type Property = {
  id: string;
  name: string;
};

export default function ClientWorkOrdersPage() {
  const supabase = getSupabaseClient();

  const [property, setProperty] = useState<Property | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWorkOrders() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view your work orders.");
          setLoading(false);
          return;
        }

        const { data: access, error: accessError } = await supabase
          .from("client_properties")
          .select("property_id")
          .eq("profile_id", user.id);

        if (accessError) throw accessError;

        if (!access || access.length === 0) {
          setError("No property has been assigned to your account.");
          setLoading(false);
          return;
        }

        const propertyIds = access.map((item) => item.property_id);

        const { data: propertyData, error: propertyError } =
          await supabase
            .from("properties")
            .select("id, name")
            .in("id", propertyIds);

        if (propertyError) throw propertyError;

        if (propertyData && propertyData.length > 0) {
          setProperty(propertyData[0]);
        }

        const { data: workOrderData, error: workOrderError } =
          await supabase
            .from("work_orders")
            .select(
              "id, title, status, priority, due_date, property_id"
            )
            .in("property_id", propertyIds)
            .order("due_date", { ascending: true });

        if (workOrderError) throw workOrderError;

        setWorkOrders(workOrderData ?? []);
      } catch (err) {
        console.error("CLIENT WORK ORDERS ERROR:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your work orders."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorkOrders();
  }, []);

  function formatDate(date: string | null) {
    if (!date) return "Not scheduled";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function getStatusClasses(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in progress":
        return "bg-blue-100 text-blue-700";
      case "scheduled":
        return "bg-purple-100 text-purple-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getPriorityClasses(priority: string | null) {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-gray-600">
            Loading your work orders...
          </p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                Work Orders
              </h1>
              <p className="mt-2 text-gray-600">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ClientSidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-8 py-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Work Orders
            </h1>
            <p className="text-sm text-gray-500">
              View maintenance activity for your property
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              Property Owner
            </p>
            <p className="text-xs text-gray-500">
              Client Portal
            </p>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                Maintenance
              </p>

              <h2 className="mt-1 text-3xl font-bold text-gray-900">
                Your Work Orders
              </h2>

              <p className="mt-2 text-gray-600">
                Review scheduled, active, and completed maintenance work.
              </p>
            </div>

            {property && (
              <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Property
                </p>

                <h3 className="mt-1 text-xl font-bold text-gray-900">
                  {property.name}
                </h3>
              </div>
            )}

            {workOrders.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-2xl">🔧</span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No Work Orders
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  There are currently no maintenance work orders for your property.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {workOrders.map((workOrder) => (
                  <div
                  key={workOrder.id}
                  onClick={() =>
                    window.location.href = `/client-work-orders/${workOrder.id}`
                  }
                  className="cursor-pointer rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {workOrder.title}
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          Due date: {formatDate(workOrder.due_date)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            workOrder.status
                          )}`}
                        >
                          {workOrder.status || "Open"}
                        </span>

                        {workOrder.priority && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                              workOrder.priority
                            )}`}
                          >
                            {workOrder.priority} Priority
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 border-t pt-5 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Status
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {workOrder.status || "Open"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Priority
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {workOrder.priority || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Scheduled Date
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {formatDate(workOrder.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}