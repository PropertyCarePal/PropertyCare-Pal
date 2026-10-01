"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import ClientSidebar from "@/components/ClientSidebar";

type MaintenancePlan = {
  id: string;
  name: string;
  description: string | null;
  property_id: string;
};

type MaintenanceTask = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  work_order_id: string | null;
  work_order_status: string | null;
  work_order_due_date: string | null;
};

export default function ClientMaintenancePlanPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const params = useParams();

  const planId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const [plan, setPlan] = useState<MaintenancePlan | null>(null);
  const [propertyName, setPropertyName] = useState("");

  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const [editingPlan, setEditingPlan] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanDescription, setEditPlanDescription] = useState("");

  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskScheduledDate, setEditTaskScheduledDate] =
    useState("");

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskScheduledDate, setNewTaskScheduledDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const [error, setError] = useState("");

  function formatDate(date: string | null) {
    if (!date) {
      return "Not scheduled";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function getStatusClasses(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "in progress":
        return "bg-blue-100 text-blue-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "scheduled":
        return "bg-blue-100 text-blue-700";

      case "open":
        return "bg-blue-100 text-blue-700";

      case "cancelled":
        return "bg-gray-100 text-gray-500";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  async function loadTasks(planIdToLoad: string) {
    const { data: taskData, error: taskError } = await supabase
      .from("maintenance_tasks")
      .select(
        "id, name, description, status, scheduled_date, completed_date, work_order_id"
      )
      .eq("plan_id", planIdToLoad)
      .order("scheduled_date", { ascending: true });

    if (taskError) {
      throw taskError;
    }

    const tasksWithWorkOrders = await Promise.all(
      (taskData ?? []).map(async (task) => {
        if (!task.work_order_id) {
          return {
            ...task,
            work_order_status: null,
            work_order_due_date: null,
          };
        }

        const { data: workOrder, error: workOrderError } =
          await supabase
            .from("work_orders")
            .select("id, status, due_date")
            .eq("id", task.work_order_id)
            .maybeSingle();

        if (workOrderError) {
          throw workOrderError;
        }

        return {
          ...task,
          work_order_status: workOrder?.status ?? null,
          work_order_due_date: workOrder?.due_date ?? null,
        };
      })
    );

    setTasks(tasksWithWorkOrders);
  }

  async function loadPlan() {
    try {
      setError("");

      if (!planId) {
        throw new Error("Maintenance plan was not found.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: planData, error: planError } = await supabase
        .from("property_maintenance_plans")
        .select("id, name, description, property_id")
        .eq("id", planId)
        .eq("is_active", true)
        .maybeSingle();

      if (planError) {
        throw planError;
      }

      if (!planData) {
        throw new Error(
          "This maintenance plan could not be found or is no longer active."
        );
      }

      const { data: access, error: accessError } = await supabase
        .from("client_properties")
        .select("property_id")
        .eq("profile_id", user.id)
        .eq("property_id", planData.property_id)
        .maybeSingle();

      if (accessError) {
        throw accessError;
      }

      if (!access) {
        throw new Error(
          "You are not authorized to view this property."
        );
      }

      const { data: propertyData, error: propertyError } =
        await supabase
          .from("properties")
          .select("id, name")
          .eq("id", planData.property_id)
          .maybeSingle();

      if (propertyError) {
        throw propertyError;
      }

      setPlan(planData);
      setPropertyName(propertyData?.name ?? "Property");

      setEditPlanName(planData.name);
      setEditPlanDescription(planData.description ?? "");

      await loadTasks(planData.id);
    } catch (err) {
      console.error("CLIENT MAINTENANCE PLAN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this maintenance plan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, [planId]);

  async function handleSavePlan() {
    if (!plan) {
      return;
    }

    if (!editPlanName.trim()) {
      setError("Please enter a maintenance plan name.");
      return;
    }

    setSavingPlan(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      const { data: access, error: accessError } = await supabase
        .from("client_properties")
        .select("property_id")
        .eq("profile_id", user.id)
        .eq("property_id", plan.property_id)
        .maybeSingle();

      if (accessError) {
        throw accessError;
      }

      if (!access) {
        throw new Error(
          "You are not authorized to edit this property."
        );
      }

      const { data: updatedPlan, error: updateError } =
        await supabase
          .from("property_maintenance_plans")
          .update({
            name: editPlanName.trim(),
            description: editPlanDescription.trim() || null,
          })
          .eq("id", plan.id)
          .select("id, name, description, property_id")
          .single();

      if (updateError) {
        throw updateError;
      }

      setPlan(updatedPlan);
      setEditingPlan(false);
    } catch (err) {
      console.error("Error saving maintenance plan:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the maintenance plan."
      );
    } finally {
      setSavingPlan(false);
    }
  }

  function startEditingTask(task: MaintenanceTask) {
    setEditingTaskId(task.id);
    setEditTaskName(task.name);
    setEditTaskDescription(task.description ?? "");
    setEditTaskScheduledDate(task.scheduled_date ?? "");
    setError("");
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    setEditTaskName("");
    setEditTaskDescription("");
    setEditTaskScheduledDate("");
  }

  async function handleSaveTask(task: MaintenanceTask) {
    if (!plan) {
      return;
    }

    if (!editTaskName.trim()) {
      setError("Please enter a task name.");
      return;
    }

    setSavingTaskId(task.id);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      const { data: access, error: accessError } = await supabase
        .from("client_properties")
        .select("property_id")
        .eq("profile_id", user.id)
        .eq("property_id", plan.property_id)
        .maybeSingle();

      if (accessError) {
        throw accessError;
      }

      if (!access) {
        throw new Error(
          "You are not authorized to edit this task."
        );
      }

      const { data: updatedTask, error: updateError } =
        await supabase
          .from("maintenance_tasks")
          .update({
            name: editTaskName.trim(),
            description: editTaskDescription.trim() || null,
            scheduled_date: editTaskScheduledDate || null,
          })
          .eq("id", task.id)
          .select(
            "id, name, description, status, scheduled_date, completed_date, work_order_id"
          )
          .single();

      if (updateError) {
        throw updateError;
      }

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                ...updatedTask,
              }
            : currentTask
        )
      );

      cancelEditingTask();
    } catch (err) {
      console.error("Error saving maintenance task:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the maintenance task."
      );
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleCreateTask() {
    if (!plan) {
      return;
    }

    if (!newTaskName.trim()) {
      setError("Please enter a maintenance task name.");
      return;
    }

    setCreatingTask(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      const { data: access, error: accessError } = await supabase
        .from("client_properties")
        .select("property_id")
        .eq("profile_id", user.id)
        .eq("property_id", plan.property_id)
        .maybeSingle();

      if (accessError) {
        throw accessError;
      }

      if (!access) {
        throw new Error(
          "You are not authorized to add a task to this property."
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error("Unable to determine your organization.");
      }

      const { data: newTask, error: createError } = await supabase
        .from("maintenance_tasks")
        .insert({
          organization_id: profile.organization_id,
          property_id: plan.property_id,
          plan_id: plan.id,
          template_item_id: null,
          asset_id: null,
          name: newTaskName.trim(),
          description: newTaskDescription.trim() || null,
          status: "pending",
          scheduled_date: newTaskScheduledDate || null,
          completed_date: null,
          assigned_to: null,
          work_order_id: null,
        })
        .select(
          "id, name, description, status, scheduled_date, completed_date, work_order_id"
        )
        .single();

      if (createError) {
        throw createError;
      }

      setTasks((currentTasks) => [
        ...currentTasks,
        {
          ...newTask,
          work_order_status: null,
          work_order_due_date: null,
        },
      ]);

      setNewTaskName("");
      setNewTaskDescription("");
      setNewTaskScheduledDate("");
      setShowCreateTask(false);
    } catch (err) {
      console.error("Error creating maintenance task:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create maintenance task."
      );
    } finally {
      setCreatingTask(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex flex-1 items-center justify-center">
          <p className="text-gray-600">
            Loading maintenance plan...
          </p>
        </main>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <button
              type="button"
              onClick={() =>
                router.push("/client-portal/maintenance")
              }
              className="mb-6 text-sm font-semibold text-[#102A43] hover:underline"
            >
              ← Back to Maintenance
            </button>

            <div className="rounded-xl bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                Maintenance Plan
              </h1>

              <p className="mt-2 text-gray-600">
                {error}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ClientSidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-8 py-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Maintenance
            </h1>

            <p className="text-sm text-gray-500">
              PropertyCare Pal Client Portal
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              Property Owner
            </p>

            <p className="text-xs text-gray-500">
              Maintenance Planning
            </p>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <button
              type="button"
              onClick={() =>
                router.push("/client-portal/maintenance")
              }
              className="mb-6 text-sm font-semibold text-[#102A43] hover:underline"
            >
              ← Back to Maintenance Plans
            </button>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {propertyName}
                  </p>

                  {!editingPlan ? (
                    <>
                      <h2 className="mt-1 text-3xl font-bold text-gray-900">
                        {plan.name}
                      </h2>

                      {plan.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                          {plan.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mt-3 w-full max-w-3xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Plan Name
                        </label>

                        <input
                          type="text"
                          value={editPlanName}
                          onChange={(event) =>
                            setEditPlanName(event.target.value)
                          }
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description
                        </label>

                        <textarea
                          value={editPlanDescription}
                          onChange={(event) =>
                            setEditPlanDescription(event.target.value)
                          }
                          rows={4}
                          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!editingPlan ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditPlanName(plan.name);
                      setEditPlanDescription(
                        plan.description ?? ""
                      );
                      setEditingPlan(true);
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Edit Plan
                  </button>
                ) : (
                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingPlan(false)}
                      className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSavePlan}
                      disabled={savingPlan || !editPlanName.trim()}
                      className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPlan ? "Saving..." : "Save Plan"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Maintenance Tasks
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Customize the maintenance items for this property.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateTask(true)}
                className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033]"
              >
                + Add Maintenance Task
              </button>
            </div>

            {showCreateTask && (
              <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">
                  Add Maintenance Task
                </h3>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Task Name
                    </label>

                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(event) =>
                        setNewTaskName(event.target.value)
                      }
                      placeholder="Example: HVAC Service"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>

                    <textarea
                      value={newTaskDescription}
                      onChange={(event) =>
                        setNewTaskDescription(event.target.value)
                      }
                      placeholder="Describe the maintenance work."
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scheduled Date
                    </label>

                    <input
                      type="date"
                      value={newTaskScheduledDate}
                      onChange={(event) =>
                        setNewTaskScheduledDate(event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateTask(false);
                        setNewTaskName("");
                        setNewTaskDescription("");
                        setNewTaskScheduledDate("");
                      }}
                      className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateTask}
                      disabled={
                        creatingTask || !newTaskName.trim()
                      }
                      className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creatingTask ? "Adding..." : "Add Task"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {tasks.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                  <p className="text-sm text-gray-500">
                    No maintenance tasks have been added to this plan yet.
                  </p>

                  <p className="mt-2 text-sm text-gray-400">
                    Click &quot;+ Add Maintenance Task&quot; above to
                    create the first one.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl bg-white p-6 shadow-sm"
                  >
                    {editingTaskId === task.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Task Name
                          </label>

                          <input
                            type="text"
                            value={editTaskName}
                            onChange={(event) =>
                              setEditTaskName(event.target.value)
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>

                          <textarea
                            value={editTaskDescription}
                            onChange={(event) =>
                              setEditTaskDescription(
                                event.target.value
                              )
                            }
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Scheduled Date
                          </label>

                          <input
                            type="date"
                            value={editTaskScheduledDate}
                            onChange={(event) =>
                              setEditTaskScheduledDate(
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={cancelEditingTask}
                            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveTask(task)}
                            disabled={
                              savingTaskId === task.id ||
                              !editTaskName.trim()
                            }
                            className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingTaskId === task.id
                              ? "Saving..."
                              : "Save Task"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">
                              {task.name}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                task.work_order_status ||
                                  task.status
                              )}`}
                            >
                              {task.work_order_status ||
                                task.status ||
                                "Pending"}
                            </span>
                          </div>

                          {task.description && (
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-6 text-sm">
                            <div>
                              <span className="text-gray-400">
                                Scheduled
                              </span>

                              <p className="font-medium text-gray-900">
                                {formatDate(
                                  task.work_order_due_date ||
                                    task.scheduled_date
                                )}
                              </p>
                            </div>

                            {task.completed_date && (
                              <div>
                                <span className="text-gray-400">
                                  Completed
                                </span>

                                <p className="font-medium text-gray-900">
                                  {formatDate(
                                    task.completed_date
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              startEditingTask(task)
                            }
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit Task
                          </button>

                          {task.work_order_id ? (
                            <span className="inline-flex rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                              Work Order Created
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/client-work-orders/new?maintenanceTaskId=${task.id}`
                                )
                              }
                              className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b2033]"
                            >
                              Create Work Order
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}