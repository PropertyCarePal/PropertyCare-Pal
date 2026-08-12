"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type WorkOrder = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  due_date: string | null;
  status: string | null;
  assigned_to: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
};

type Property = {
  id: string;
  name: string;
};

export default function WorkOrdersPage() {
  const { user, loading } = useAuth();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    async function loadWorkOrders() {
      if (!user) {
        setLoadingWorkOrders(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("PROFILE ERROR:", profileError);
        setLoadingWorkOrders(false);
        return;
      }

      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("id, name")
        .eq("organization_id", profile.organization_id);

      if (propertyError) {
        console.error("PROPERTY LOAD ERROR:", propertyError);
      } else {
        setProperties(propertyData || []);
      }

      const { data: workOrderData, error: workOrderError } = await supabase
        .from("work_orders")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (workOrderError) {
        console.error("WORK ORDER LOAD ERROR:", workOrderError);
      } else {
        console.log("ALL WORK ORDERS LOADED:", workOrderData);
        setWorkOrders(workOrderData || []);
      }

      setLoadingWorkOrders(false);
    }

    if (!loading) {
      loadWorkOrders();
    }
  }, [user, loading]);

  function getPropertyName(propertyId: string) {
    const property = properties.find(
      (property) => property.id === propertyId
    );

    return property?.name || "Unknown Property";
  }

  if (loading || loadingWorkOrders) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
        <p className="mt-2 text-gray-600">Loading work orders...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Work Orders
        </h1>

        <p className="mt-2 text-gray-600">
          Manage maintenance work orders across all of your properties.
        </p>
        <div className="mt-6">
  <label
    htmlFor="workOrderSearch"
    className="mr-3 text-sm font-medium text-gray-700"
  >
    Search:
  </label>

  <input
    id="workOrderSearch"
    type="text"
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    placeholder="Search work orders..."
    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
  />
</div>
        <div className="mt-6">
  <label
    htmlFor="statusFilter"
    className="mr-3 text-sm font-medium text-gray-700"
  >
    Filter by Status:
  </label>

  <select
    id="statusFilter"
    value={statusFilter}
    onChange={(event) => setStatusFilter(event.target.value)}
    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
  >
    <option value="All">All</option>
    <option value="Open">Open</option>
    <option value="In Progress">In Progress</option>
    <option value="Completed">Completed</option>
  </select>
</div>
      </div>

      {workOrders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            No Work Orders Yet
          </h2>

          <p className="mt-2 text-gray-600">
            Work orders created inside your properties will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
        {workOrders
  .filter(
    (workOrder) =>
      (statusFilter === "All" || workOrder.status === statusFilter) &&
      (
        workOrder.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        workOrder.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  )
  .map((workOrder) => (
            <div
              key={workOrder.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {workOrder.title}
                  </h2>

                  <Link
                    href={`/properties/${workOrder.property_id}`}
                    className="mt-1 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {getPropertyName(workOrder.property_id)}
                  </Link>

                  {workOrder.description && (
                    <p className="mt-3 text-gray-600">
                      {workOrder.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    {workOrder.status || "Open"}
                  </span>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    {workOrder.priority || "Medium"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Due Date
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {workOrder.due_date
                      ? new Date(workOrder.due_date).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Assigned To
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {workOrder.assigned_to || "Unassigned"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estimated Cost
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {workOrder.estimated_cost !== null
                      ? `$${Number(workOrder.estimated_cost).toFixed(2)}`
                      : "Not set"}
                  </p>
                </div>
              </div>

              {workOrder.actual_cost !== null && (
                <div className="mt-4 text-sm text-gray-600">
                  Actual Cost:{" "}
                  <span className="font-semibold text-gray-900">
                    ${Number(workOrder.actual_cost).toFixed(2)}
                  </span>
                </div>
              )}

              {workOrder.completion_notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Completion Notes
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {workOrder.completion_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}