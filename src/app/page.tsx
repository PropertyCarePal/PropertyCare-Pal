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
  property_id: string | null;
};

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = getSupabaseClient();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [propertyActivity, setPropertyActivity] = useState<
  Record<
    string,
    {
      propertyName: string;
      activeCount: number;
      overdueCount: number;
    }
  >
>({});
const [propertyCount, setPropertyCount] = useState(0);
const [assetCount, setAssetCount] = useState(0);
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
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        completed_at,
        property_id
      `)
      .eq("organization_id", profile.organization_id)
      .order("due_date", { ascending: true });
    
    if (error) {
      console.error("DASHBOARD WORK ORDERS ERROR:", error);
      setLoadingWorkOrders(false);
      return;
    }
    const { data: properties, error: propertiesError } = await supabase
  .from("properties")
  .select("id, name")
  .eq("organization_id", profile.organization_id);

if (propertiesError) {
  console.error("DASHBOARD PROPERTIES ERROR:", propertiesError);
}
const activity = (data ?? [])
  .filter(
    (workOrder) =>
      workOrder.status !== "Completed" &&
      workOrder.status !== "Cancelled" &&
      workOrder.property_id
  )
  .reduce(
    (result, workOrder) => {
      const property = properties?.find(
        (property) => property.id === workOrder.property_id
      );

      if (!property || !workOrder.property_id) {
        return result;
      }

      if (!result[workOrder.property_id]) {
        result[workOrder.property_id] = {
          propertyName: property.name,
          activeCount: 0,
          overdueCount: 0,
        };
      }

      result[workOrder.property_id].activeCount += 1;

      if (workOrder.due_date) {
        const dueDate = new Date(`${workOrder.due_date}T00:00:00`);

        if (dueDate < today) {
          result[workOrder.property_id].overdueCount += 1;
        }
      }

      return result;
    },
    {} as Record<
      string,
      {
        propertyName: string;
        activeCount: number;
        overdueCount: number;
      }
    >
  );

setPropertyActivity(activity);

 

   
 

      setWorkOrders(data ?? []);

const { count: propertiesCount, error: propertiesCountError } =
  await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id);

if (propertiesCountError) {
  console.error(
    "DASHBOARD PROPERTY COUNT ERROR:",
    propertiesCountError
  );
} else {
  setPropertyCount(propertiesCount ?? 0);
}

const { count: assetsCount, error: assetsCountError } =
  await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id);

if (assetsCountError) {
  console.error(
    "DASHBOARD ASSET COUNT ERROR:",
    assetsCountError
  );
} else {
  setAssetCount(assetsCount ?? 0);
}

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
  const openWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "Open"
  );

  const inProgressWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "In Progress"
  );

  const completedWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "Completed"
  );

  const cancelledWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "Cancelled"
  );
  const highPriorityWorkOrders = activeWorkOrders.filter(
    (workOrder) => workOrder.priority === "High"
  );
  
  const mediumPriorityWorkOrders = activeWorkOrders.filter(
    (workOrder) => workOrder.priority === "Medium"
  );
  
  const lowPriorityWorkOrders = activeWorkOrders.filter(
    (workOrder) => workOrder.priority === "Low"
  );
  const recentMaintenanceWorkOrders = workOrders
  .filter((workOrder) => workOrder.status === "Completed")
  .sort((a, b) => {
    const dateA = a.completed_at
      ? new Date(a.completed_at).getTime()
      : 0;

    const dateB = b.completed_at
      ? new Date(b.completed_at).getTime()
      : 0;

    return dateB - dateA;
  })
  .slice(0, 8);
  const upcomingMaintenanceByDate = activeWorkOrders
  .filter((workOrder) => workOrder.due_date)
  .sort((a, b) => {
    const dateA = new Date(`${a.due_date}T00:00:00`).getTime();
    const dateB = new Date(`${b.due_date}T00:00:00`).getTime();

    return dateA - dateB;
  })
  .slice(0, 7);
  
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
            <p className="mt-4 text-4xl font-bold">
  {propertyCount}
</p>
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
            <p className="mt-4 text-4xl font-bold">
  {assetCount}
</p>
            <p className="text-gray-500">
              Tracked property assets
            </p>
          </div>
        </section>
        
        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Maintenance Status
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => router.push("/work-orders")}
              className="rounded-xl bg-white p-5 text-left shadow transition hover:shadow-md"
            >
              <p className="text-sm font-medium text-gray-500">
                Open
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {openWorkOrders.length}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Work orders
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/work-orders")}
              className="rounded-xl bg-white p-5 text-left shadow transition hover:shadow-md"
            >
              <p className="text-sm font-medium text-gray-500">
                In Progress
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {inProgressWorkOrders.length}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Work orders
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/work-orders")}
              className="rounded-xl bg-white p-5 text-left shadow transition hover:shadow-md"
            >
              <p className="text-sm font-medium text-gray-500">
                Completed
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {completedWorkOrders.length}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Work orders
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/work-orders")}
              className="rounded-xl bg-white p-5 text-left shadow transition hover:shadow-md"
            >
              <p className="text-sm font-medium text-gray-500">
                Cancelled
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-500">
                {cancelledWorkOrders.length}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Work orders
              </p>
            </button>
          </div>
        </section>
        <section className="mt-8">
  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
    Maintenance Priorities
  </h2>

  <div className="grid gap-4 md:grid-cols-3">
    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="rounded-xl bg-white p-6 text-left shadow transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-red-700">
          High Priority
        </h3>

        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
          {highPriorityWorkOrders.length}
        </span>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Active high-priority maintenance items
      </p>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="rounded-xl bg-white p-6 text-left shadow transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-orange-700">
          Medium Priority
        </h3>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
          {mediumPriorityWorkOrders.length}
        </span>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Active medium-priority maintenance items
      </p>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="rounded-xl bg-white p-6 text-left shadow transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-700">
          Low Priority
        </h3>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
          {lowPriorityWorkOrders.length}
        </span>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Active low-priority maintenance items
      </p>
    </button>
  </div>
</section> 
<section className="mt-8">
  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
    Recent Maintenance Activity
  </h2>

  <div className="rounded-xl bg-white p-6 shadow">
    {recentMaintenanceWorkOrders.length === 0 ? (
      <p className="text-sm text-gray-500">
        No completed maintenance activity yet.
      </p>
    ) : (
      <div className="space-y-3">
        {recentMaintenanceWorkOrders.map((workOrder) => (
          <button
            key={workOrder.id}
            type="button"
            onClick={() =>
              router.push(`/work-orders/${workOrder.id}`)
            }
            className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition hover:bg-gray-100"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">
                {workOrder.title}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Completed{" "}
                {formatCompletedDate(workOrder.completed_at)}
              </p>
            </div>

            <span className="shrink-0 text-sm font-medium text-blue-600">
              View →
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
</section>
<section className="mt-8">
  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
    Upcoming Maintenance Calendar
  </h2>

  <div className="rounded-xl bg-white p-6 shadow">
    {upcomingMaintenanceByDate.length === 0 ? (
      <p className="text-sm text-gray-500">
        No upcoming maintenance scheduled.
      </p>
    ) : (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {upcomingMaintenanceByDate.map((workOrder) => (
          <button
            key={workOrder.id}
            type="button"
            onClick={() =>
              router.push(`/work-orders/${workOrder.id}`)
            }
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition hover:bg-gray-100"
          >
            <p className="font-semibold text-gray-900">
              {workOrder.title}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Due {formatDate(workOrder.due_date)}
            </p>

            {workOrder.priority && (
              <span className="mt-3 inline-block rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {workOrder.priority}
              </span>
            )}
          </button>
        ))}
      </div>
    )}
  </div>
</section>
        <section className="mt-8">
  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
    Property Activity
  </h2>

  {Object.keys(propertyActivity).length === 0 ? (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-gray-500">
        No properties currently have active maintenance work.
      </p>
    </div>
  ) : (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(propertyActivity)
        .sort(([, a], [, b]) => b.activeCount - a.activeCount)
        .slice(0, 6)
        .map(([propertyId, activity]) => (
          <button
            key={propertyId}
            type="button"
            onClick={() => router.push(`/properties/${propertyId}`)}
            className="rounded-xl bg-white p-5 text-left shadow transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-semibold text-gray-900">
                {activity.propertyName}
              </h3>

              {activity.overdueCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  {activity.overdueCount} overdue
                </span>
              )}
            </div>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {activity.activeCount}
            </p>

            <p className="text-sm text-gray-500">
              Active maintenance{" "}
              {activity.activeCount === 1 ? "item" : "items"}
            </p>

            <p className="mt-3 text-sm font-medium text-gray-600">
              View property →
            </p>
          </button>
        ))}
    </div>
  )}
</section>
<section className="mt-8">
  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
    Upcoming Maintenance
  </h2>

  {loadingWorkOrders ? (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-gray-500">
        Loading upcoming maintenance...
      </p>
    </div>
  ) : (
    <div className="rounded-xl bg-white p-6 shadow">
      {activeWorkOrders
        .filter((workOrder) => workOrder.due_date)
        .sort(
          (a, b) =>
            new Date(`${a.due_date}T00:00:00`).getTime() -
            new Date(`${b.due_date}T00:00:00`).getTime()
        )
        .slice(0, 6)
        .length === 0 ? (
        <p className="text-sm text-gray-500">
          No upcoming maintenance scheduled.
        </p>
      ) : (
        <div className="space-y-3">
          {activeWorkOrders
            .filter((workOrder) => workOrder.due_date)
            .sort(
              (a, b) =>
                new Date(`${a.due_date}T00:00:00`).getTime() -
                new Date(`${b.due_date}T00:00:00`).getTime()
            )
            .slice(0, 6)
            .map((workOrder) => (
              <button
                key={workOrder.id}
                type="button"
                onClick={() =>
                  router.push(`/work-orders/${workOrder.id}`)
                }
                className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition hover:bg-gray-100"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {workOrder.title}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Due {formatDate(workOrder.due_date)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {workOrder.priority && (
                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {workOrder.priority}
                    </span>
                  )}

                  <span className="text-sm font-medium text-blue-600">
                    View →
                  </span>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  )}
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