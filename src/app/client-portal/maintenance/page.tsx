"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import ClientSidebar from "@/components/ClientSidebar";

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

type MaintenancePlan = {
  id: string;
  name: string;
  description: string | null;
  property_id: string;
};

export default function ClientMaintenancePage() {
  const supabase = getSupabaseClient();

  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [selectedPlan, setSelectedPlan] =
    useState<MaintenancePlan | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskScheduledDate, setNewTaskScheduledDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTasksForPlan(planId: string) {
    const { data: taskData, error: taskError } = await supabase
      .from("maintenance_tasks")
      .select(
        "id, name, description, status, scheduled_date, completed_date, work_order_id"
      )
      .eq("plan_id", planId)
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

  async function loadMaintenance() {
    try {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view maintenance.");
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

      if (!access || access.length === 0) {
        setError("No property has been assigned to your account.");
        setLoading(false);
        return;
      }

      const propertyIds = access.map((item) => item.property_id);

      const { data: planData, error: planError } = await supabase
        .from("property_maintenance_plans")
        .select("id, name, description, property_id")
        .in("property_id", propertyIds)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (planError) {
        throw planError;
      }

      setPlans(planData ?? []);

      if (!planData || planData.length === 0) {
        setSelectedPlan(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      const firstPlan = planData[0];

      setSelectedPlan(firstPlan);

      await loadTasksForPlan(firstPlan.id);
    } catch (err) {
      console.error("CLIENT MAINTENANCE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your maintenance information."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlan(plan: MaintenancePlan) {
    setSelectedPlan(plan);
    setError("");
    setShowCreateTask(false);

    try {
      await loadTasksForPlan(plan.id);
    } catch (err) {
      console.error("Error loading maintenance plan:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this maintenance plan."
      );
    }
  }
  async function handleDeletePlan(plan: MaintenancePlan) {
    const confirmed = window.confirm(
      `Delete "${plan.name}"?\n\nThis will remove the maintenance plan from your active plans.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingPlanId(plan.id);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("property_maintenance_plans")
        .update({ is_active: false })
        .eq("id", plan.id);

      if (deleteError) {
        throw deleteError;
      }

      const remainingPlans = plans.filter(
        (currentPlan) => currentPlan.id !== plan.id
      );

      setPlans(remainingPlans);

      if (selectedPlan?.id === plan.id) {
        if (remainingPlans.length > 0) {
          const nextPlan = remainingPlans[0];

          setSelectedPlan(nextPlan);
          setShowCreateTask(false);

          await loadTasksForPlan(nextPlan.id);
        } else {
          setSelectedPlan(null);
          setTasks([]);
          setShowCreateTask(false);
        }
      }
    } catch (err) {
      console.error("Error deleting maintenance plan:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete maintenance plan."
      );
    } finally {
      setDeletingPlanId(null);
    }
  }

  async function handleCreatePlan() {
    if (!newPlanName.trim()) {
      setError("Please enter a maintenance plan name.");
      return;
    }

    setCreatingPlan(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "You must be logged in to create a maintenance plan."
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

      const { data: access, error: accessError } = await supabase
        .from("client_properties")
        .select("property_id")
        .eq("profile_id", user.id);

      if (accessError) {
        throw accessError;
      }

      if (!access || access.length === 0) {
        throw new Error(
          "No property has been assigned to your account."
        );
      }

      const propertyId = access[0].property_id;

      const { data: newPlan, error: createError } = await supabase
        .from("property_maintenance_plans")
        .insert({
          organization_id: profile.organization_id,
          property_id: propertyId,
          name: newPlanName.trim(),
          description: newPlanDescription.trim() || null,
          is_active: true,
        })
        .select("id, name, description, property_id")
        .single();

      if (createError) {
        throw createError;
      }

      setPlans((currentPlans) => [...currentPlans, newPlan]);
      setSelectedPlan(newPlan);
      setTasks([]);

      setNewPlanName("");
      setNewPlanDescription("");
      setShowCreatePlan(false);
    } catch (err) {
      console.error("Error creating maintenance plan:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create maintenance plan."
      );
    } finally {
      setCreatingPlan(false);
    }
  }

  async function handleCreateTask() {
    if (!selectedPlan) {
      setError("Please select a maintenance plan first.");
      return;
    }

    if (!newTaskName.trim()) {
      setError("Please enter a maintenance task name.");
      return;
    }

    setCreatingTask(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "You must be logged in to create a maintenance task."
        );
      }

      const { data: access, error: accessError } = await supabase
        .from("client_properties")
        .select("property_id")
        .eq("profile_id", user.id)
        .eq("property_id", selectedPlan.property_id)
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

      if (profileError) {
        throw profileError;
      }

      if (!profile?.organization_id) {
        throw new Error("Unable to determine your organization.");
      }

      const { data: newTask, error: createError } = await supabase
        .from("maintenance_tasks")
        .insert({
          organization_id: profile.organization_id,
          property_id: selectedPlan.property_id,
          plan_id: selectedPlan.id,
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

      const taskWithWorkOrder: MaintenanceTask = {
        ...newTask,
        work_order_status: null,
        work_order_due_date: null,
      };

      setTasks((currentTasks) => [
        ...currentTasks,
        taskWithWorkOrder,
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
  useEffect(() => {
    loadMaintenance();
  }, []);

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex flex-1 items-center justify-center">
          <p className="text-gray-600">Loading maintenance...</p>
        </main>
      </div>
    );
  }

  if (error && !selectedPlan) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                Maintenance
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
            <div className="mb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Property Maintenance
                  </h2>

                  <p className="mt-2 text-gray-600">
                    Create and manage your property's maintenance plans and
                    scheduled services.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreatePlan(true)}
                  className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033]"
                >
                  + Create Maintenance Plan
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {showCreatePlan && (
              <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">
                  Create Maintenance Plan
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Create a custom maintenance list for your property.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Plan Name
                    </label>

                    <input
                      type="text"
                      value={newPlanName}
                      onChange={(event) =>
                        setNewPlanName(event.target.value)
                      }
                      placeholder="Example: Summer Home Maintenance"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>

                    <textarea
                      value={newPlanDescription}
                      onChange={(event) =>
                        setNewPlanDescription(event.target.value)
                      }
                      placeholder="Describe what this maintenance plan is for."
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreatePlan(false);
                        setNewPlanName("");
                        setNewPlanDescription("");
                      }}
                      className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleCreatePlan}
                      disabled={creatingPlan || !newPlanName.trim()}
                      className="rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creatingPlan ? "Creating..." : "Create Plan"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {plans.length > 0 && (
              <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  My Maintenance Plans
                </h3>

                <div className="mt-4 flex flex-wrap gap-3">
                {plans.map((plan) => (
  <div
    key={plan.id}
    className="relative"
  >
    <button
      type="button"
      onClick={() => handleSelectPlan(plan)}
      disabled={deletingPlanId === plan.id}
      className={`rounded-lg px-5 py-3 pr-10 text-sm font-semibold ${
        selectedPlan?.id === plan.id
          ? "bg-[#102A43] text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {plan.name}
    </button>

    <button
      type="button"
      onClick={() => handleDeletePlan(plan)}
      disabled={deletingPlanId === plan.id}
      aria-label={`Delete ${plan.name}`}
      className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
        selectedPlan?.id === plan.id
          ? "text-white hover:bg-white/20"
          : "text-gray-500 hover:bg-gray-200"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      ×
    </button>
  </div>
))}
                </div>
              </div>
            )}

            {!selectedPlan ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  No maintenance plan assigned
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Create a maintenance plan to start organizing your
                  property's maintenance.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedPlan.name}
                      </h3>

                      {selectedPlan.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {selectedPlan.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCreateTask(true)}
                      className="shrink-0 rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b2033]"
                    >
                      + Add Maintenance Task
                    </button>
                  </div>
                </div>

                {showCreateTask && (
                  <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900">
                      Add Maintenance Task
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Add a maintenance item to this plan.
                    </p>

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
                          {creatingTask
                            ? "Adding..."
                            : "Add Task"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  {tasks.length === 0 ? (
                    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                      <p className="text-sm text-gray-500">
                        No maintenance tasks have been added to this plan
                        yet.
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

                          <div className="shrink-0">
                            {task.work_order_id ? (
                              <span className="inline-flex rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                                Work Order Created
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  (window.location.href = `/client-work-orders/new?maintenanceTaskId=${task.id}`)
                                }
                                className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b2033]"
                              >
                                Create Work Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}