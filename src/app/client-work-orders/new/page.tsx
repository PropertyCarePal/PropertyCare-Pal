"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import ClientSidebar from "@/components/ClientSidebar";

type MaintenanceTask = {
  id: string;
  name: string;
  description: string | null;
  scheduled_date: string | null;
  property_id: string;
};

type Property = {
  id: string;
  name: string;
};

export default function ClientNewWorkOrderPage() {
  const supabase = getSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const maintenanceTaskId = searchParams.get("maintenanceTaskId");

  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [scheduledDate, setScheduledDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTask() {
      try {
        if (!maintenanceTaskId) {
          setError("No maintenance task was provided.");
          setLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in.");
          setLoading(false);
          return;
        }

        const { data: access, error: accessError } = await supabase
          .from("client_properties")
          .select("property_id")
          .eq("profile_id", user.id);

        if (accessError) {
          throw accessError;
        }

        const propertyIds = (access ?? []).map(
          (item) => item.property_id
        );

        if (propertyIds.length === 0) {
          setError("No property has been assigned to your account.");
          setLoading(false);
          return;
        }

        const { data: taskData, error: taskError } = await supabase
          .from("maintenance_tasks")
          .select(
            "id, name, description, scheduled_date, property_id"
          )
          .eq("id", maintenanceTaskId)
          .in("property_id", propertyIds)
          .maybeSingle();

        if (taskError) {
          throw taskError;
        }

        if (!taskData) {
          setError(
            "This maintenance task could not be found or is not assigned to your property."
          );
          setLoading(false);
          return;
        }

        setTask(taskData);
        setTitle(taskData.name);
        setDescription(taskData.description ?? "");

        if (taskData.scheduled_date) {
          setScheduledDate(taskData.scheduled_date);
        }

        const { data: propertyData, error: propertyError } =
          await supabase
            .from("properties")
            .select("id, name")
            .eq("id", taskData.property_id)
            .maybeSingle();

        if (propertyError) {
          throw propertyError;
        }

        setProperty(propertyData);
      } catch (err) {
        console.error("CLIENT NEW WORK ORDER ERROR:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the maintenance task."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTask();
  }, [maintenanceTaskId]);

  async function createWorkOrder() {
    try {
      setSaving(true);
      setError("");

      if (!task) {
        setError("Maintenance task information is missing.");
        setSaving(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        setSaving(false);
        return;
      }

      const { data: access, error: accessError } = await supabase
        .from("client_properties")
        .select("property_id")
        .eq("profile_id", user.id);

      if (accessError) {
        throw accessError;
      }

      const propertyIds = (access ?? []).map(
        (item) => item.property_id
      );

      if (!propertyIds.includes(task.property_id)) {
        setError("You are not authorized to create work for this property.");
        setSaving(false);
        return;
      }

      const { data: existingTask, error: existingTaskError } =
        await supabase
          .from("maintenance_tasks")
          .select("work_order_id")
          .eq("id", task.id)
          .maybeSingle();

      if (existingTaskError) {
        throw existingTaskError;
      }

      if (existingTask?.work_order_id) {
        router.push(`/client-work-orders/${existingTask.work_order_id}`);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.organization_id) {
        setError("Your account is not connected to an organization.");
        setSaving(false);
        return;
      }

      const { data: workOrder, error: workOrderError } =
        await supabase
          .from("work_orders")
          .insert({
            organization_id: profile.organization_id,
            property_id: task.property_id,
            title,
            description,
            status: "Scheduled",
            priority,
            due_date: scheduledDate || null,
            estimated_cost: null,
            actual_cost: null,
          })
          .select("id")
          .single();

      if (workOrderError) {
        throw workOrderError;
      }

      const { error: updateTaskError } = await supabase
        .from("maintenance_tasks")
        .update({
          work_order_id: workOrder.id,
        })
        .eq("id", task.id);

      if (updateTaskError) {
        throw updateTaskError;
      }

      router.push(`/client-work-orders/${workOrder.id}`);
    } catch (err) {
      console.error("CREATE CLIENT WORK ORDER ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the work order."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex flex-1 items-center justify-center">
          <p className="text-gray-600">
            Loading maintenance task...
          </p>
        </main>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                Create Work Order
              </h1>

              <p className="mt-3 text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/client-portal/maintenance")
                }
                className="mt-6 rounded-lg bg-[#102A43] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Back to Maintenance
              </button>
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
              Create Work Order
            </h1>

            <p className="text-sm text-gray-500">
              PropertyCare Pal Client Portal
            </p>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <button
                type="button"
                onClick={() =>
                  router.push("/client-portal/maintenance")
                }
                className="text-sm font-medium text-[#102A43] hover:underline"
              >
                ← Back to Maintenance
              </button>
            </div>

            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  New Work Order
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Create a work order from your maintenance task.
                </p>
              </div>

              {property && (
                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Property
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {property.name}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Work Order Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43]"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>

                    <select
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#102A43]"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scheduled Date
                    </label>

                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(event) =>
                        setScheduledDate(event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/client-portal/maintenance")
                    }
                    className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={createWorkOrder}
                    disabled={saving || !title.trim()}
                    className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Creating Work Order..."
                      : "Create Work Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}