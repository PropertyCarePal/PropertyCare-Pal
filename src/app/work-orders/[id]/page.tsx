"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function WorkOrderDetailPage() {
  const params = useParams();
  const { user, loading } = useAuth();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && user && params.id) {
      loadWorkOrder();
    }
  }, [loading, user, params.id]);

  async function loadWorkOrder() {
    if (!user || !params.id) return;

    setPageLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("PROFILE ERROR:", profileError);
      setPageLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("work_orders")
      .select("*")
      .eq("id", String(params.id))
      .eq("organization_id", profile.organization_id)
      .single();

    if (error) {
      console.error("WORK ORDER LOAD ERROR:", error);
      setPageLoading(false);
      return;
    }

    setWorkOrder(data);

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", data.property_id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (propertyError) {
      console.error("PROPERTY LOAD ERROR:", propertyError);
    } else {
      setProperty(propertyData);
    }

    setPageLoading(false);
  }

  if (loading || pageLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading work order...</p>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Work Order Not Found
        </h1>

        <Link
          href="/work-orders"
          className="mt-4 inline-block text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Work Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/work-orders"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Work Orders
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {workOrder.title}
            </h1>

            {property && (
              <Link
                href={`/properties/${property.id}`}
                className="mt-2 inline-block text-emerald-600 hover:text-emerald-700"
              >
                {property.name}
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
              {workOrder.status || "Open"}
            </span>

            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              {workOrder.priority || "Medium"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Description
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-gray-600">
            {workOrder.description || "No description provided."}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Work Order Details
          </h2>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Due Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.due_date
                  ? new Date(workOrder.due_date).toLocaleDateString()
                  : "Not set"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Assigned To
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.assigned_to || "Not assigned"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Estimated Cost
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.estimated_cost !== null
                  ? `$${workOrder.estimated_cost.toLocaleString()}`
                  : "Not set"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actual Cost
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.actual_cost !== null
                  ? `$${workOrder.actual_cost.toLocaleString()}`
                  : "Not set"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(workOrder.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Completion Notes
        </h2>

        <p className="mt-3 whitespace-pre-wrap text-gray-600">
          {workOrder.completion_notes || "No completion notes yet."}
        </p>

        {workOrder.completed_at && (
          <p className="mt-4 text-sm text-gray-500">
            Completed on{" "}
            {new Date(workOrder.completed_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}