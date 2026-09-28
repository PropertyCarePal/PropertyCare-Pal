
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type MaintenanceTask = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  work_order_id: string | null;
  property_id: string;
  property_name?: string;
};

export default function MaintenanceTasksPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

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

    async function loadTasks() {
      setLoadingTasks(true);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user!.id)
        .single();

      if (profileError || !profile?.organization_id) {
        console.error("Error loading profile:", profileError);
        setLoadingTasks(false);
        return;
      }

      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
            id,
            name,
            description,
            status,
            scheduled_date,
            completed_date,
            work_order_id,
            property_id,
            properties (
              id,
              name
            )
          `) 
        .eq("organization_id", profile.organization_id)
        .order("scheduled_date", {
          ascending: true,
          nullsFirst: false,
        });

      if (error) {
        console.error("Error loading maintenance tasks:", error);
        setLoadingTasks(false);
        return;
      }

      const formattedTasks: MaintenanceTask[] = (data ?? []).map(
        (task) => {
          const property = Array.isArray(task.properties)
            ? task.properties[0]
            : task.properties;

          return {
            id: task.id,
            name: task.name,
            description: task.description,
            status: task.status,
            scheduled_date: task.scheduled_date,
            completed_date: task.completed_date,
work_order_id: task.work_order_id,
property_id: task.property_id,
            property_name: property?.name ?? "Unknown Property",
          };
        }
      );

      setTasks(formattedTasks);
      setLoadingTasks(false);
    }

    loadTasks();
  }, [user, loading, role]);

  function getStatusClasses(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "in progress":
        return "bg-blue-100 text-blue-700";

      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  function formatDate(date: string | null) {
    if (!date) return "Not scheduled";

   return new Date(date + "T00:00:00").toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }
  async function handleStatusChange(
    taskId: string,
    newStatus: string
  ) {
    setUpdatingTaskId(taskId);
  
    const completedDate =
      newStatus.toLowerCase() === "completed"
        ? new Date().toISOString().split("T")[0]
        : null;
  
    const { error } = await supabase
      .from("maintenance_tasks")
      .update({
        status: newStatus,
        completed_date: completedDate,
      })
      .eq("id", taskId);
  
    if (error) {
      console.error("Error updating maintenance task:", error);
      alert("Unable to update maintenance task.");
      setUpdatingTaskId(null);
      return;
    }
  
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completed_date: completedDate,
            }
          : task
      )
    );
  
    setUpdatingTaskId(null);
  }

  if (loading || loadingTasks) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-gray-500">
            Loading maintenance tasks...
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Maintenance Tasks
          </h1>

          <p className="mt-2 text-gray-500">
            View and manage scheduled property maintenance tasks.
          </p>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              No Maintenance Tasks
            </h2>

            <p className="mt-2 text-gray-500">
              Maintenance tasks created from your maintenance plans
              will appear here.
            </p>

            <button
              type="button"
              onClick={() => router.push("/maintenance")}
              className="mt-6 rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033]"
            >
              Go to Maintenance Plans
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Task
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Property
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Scheduled
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Completed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
  Action
</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-gray-900">
                          {task.name}
                        </p>

                        {task.description && (
                          <p className="mt-1 max-w-md text-sm text-gray-500">
                            {task.description}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-gray-700">
                        {task.property_name}
                      </td>

                      <td className="px-6 py-5">
  <select
    value={task.status}
    onChange={(event) =>
      handleStatusChange(task.id, event.target.value)
    }
    disabled={updatingTaskId === task.id}
    className={
      "rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none " +
      getStatusClasses(task.status)
    }
  >
    <option value="pending">Pending</option>
    <option value="in progress">In Progress</option>
    <option value="completed">Completed</option>
  </select>
</td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(task.scheduled_date)}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(task.completed_date)}
                      </td>
                      <td className="px-6 py-5">
  {task.work_order_id ? (
    <span className="text-sm font-medium text-green-700">
      Work Order Created
    </span>
  ) : (
    <button
      type="button"
      onClick={() =>
        router.push(`/work-orders/new?maintenanceTaskId=${task.id}`)
      }
      className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b2033]"
    >
      Create Work Order
    </button>
  )}
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

