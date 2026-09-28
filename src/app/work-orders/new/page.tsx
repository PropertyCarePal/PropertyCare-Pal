"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type MaintenanceTask = {
  id: string;
  name: string;
  description: string | null;
  property_id: string;
  property_name: string;
};

export default function NewWorkOrderPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const maintenanceTaskId =
    searchParams.get("maintenanceTaskId");

  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (!loading && user && role === "Client") {
      router.push("/client-portal");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (!user || loading || role === "Client") return;

    async function loadMaintenanceTask() {
      setLoadingTask(true);

      if (!maintenanceTaskId) {
        setLoadingTask(false);
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user!.id)
          .single();

      if (profileError || !profile?.organization_id) {
        console.error(
          "Error loading profile:",
          profileError
        );
        setLoadingTask(false);
        return;
      }

      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
          id,
          name,
          description,
          property_id,
          properties (
            id,
            name
          )
        `)
        .eq("id", maintenanceTaskId)
        .eq(
          "organization_id",
          profile.organization_id
        )
        .single();

      if (error) {
        console.error(
          "Error loading maintenance task:",
          error
        );
        setLoadingTask(false);
        return;
      }

      const property = Array.isArray(data.properties)
        ? data.properties[0]
        : data.properties;

      const loadedTask: MaintenanceTask = {
        id: data.id,
        name: data.name,
        description: data.description,
        property_id: data.property_id,
        property_name:
          property?.name ?? "Unknown Property",
      };

      setTask(loadedTask);
      setTitle(loadedTask.name);
      setDescription(loadedTask.description ?? "");

      setLoadingTask(false);
    }

    loadMaintenanceTask();
  }, [
    user,
    loading,
    role,
    maintenanceTaskId,
  ]);

  async function handleCreateWorkOrder() {
    if (!user || !task) return;

    if (!title.trim()) {
      alert("Please enter a work order title.");
      return;
    }

    setSaving(true);

    try {
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

      if (
        profileError ||
        !profile?.organization_id
      ) {
        console.error(
          "Error loading profile:",
          profileError
        );
        alert(
          "Unable to determine your organization."
        );
        return;
      }

      const { data: workOrder, error } =
        await supabase
          .from("work_orders")
          .insert({
            organization_id:
              profile.organization_id,
            property_id: task.property_id,
            title: title.trim(),
            description:
              description.trim() || null,
            status: "Scheduled",
            priority,
            due_date: dueDate || null,
            estimated_cost: null,
            actual_cost: null,
          })
          .select("id")
          .single();

      if (error) {
        console.error(
          "Error creating work order:",
          error
        );
        alert(
          "Unable to create work order."
        );
        return;
      }

      if (!workOrder?.id) {
        alert(
          "Work order was created, but its ID could not be determined."
        );
        return;
      }

      const { error: linkError } =
        await supabase
          .from("maintenance_tasks")
          .update({
            work_order_id: workOrder.id,
          })
          .eq("id", task.id);

      if (linkError) {
        console.error(
          "Error linking maintenance task:",
          linkError
        );
        alert(
          "The work order was created, but it could not be linked to the maintenance task."
        );
        return;
      }

      alert(
        "Work order created successfully."
      );

      router.push(
        `/work-orders/${workOrder.id}`
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingTask) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-gray-500">
            Loading work order...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Maintenance Task Not Found
          </h1>

          <p className="mt-2 text-gray-500">
            We couldn't find the maintenance task
            you're trying to turn into a work order.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/maintenance/tasks"
              )
            }
            className="mt-6 rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033]"
          >
            Back to Maintenance Tasks
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                "/maintenance/tasks"
              )
            }
            className="mb-4 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to Maintenance Tasks
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Create Work Order
          </h1>

          <p className="mt-2 text-gray-500">
            Turn this maintenance task into an
            active work order.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 rounded-lg bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Maintenance Task
            </p>

            <p className="mt-1 text-lg font-semibold text-gray-900">
              {task.name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {task.property_name}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700"
              >
                Work Order Title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
              />
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-semibold text-gray-700"
              >
                Priority
              </label>

              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>

                <option value="urgent">
                  Urgent
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-semibold text-gray-700"
              >
                Scheduled Date
              </label>

              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/maintenance/tasks"
                  )
                }
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateWorkOrder
                }
                disabled={saving}
                className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Creating..."
                  : "Create Work Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}