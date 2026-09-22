"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { getSupabaseClient } from "@/lib/supabase";
function HouseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a2.1 2.1 0 0 0 3 3l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.7-.6-.6-2.7z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.5h.5A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.5V13h-.5a1.7 1.7 0 0 0-1.5 2z" />
    </svg>
  );
}

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
  const { user, role, loading } = useAuth();
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
  if (role === "Client") {
    router.push("/client-portal");
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
  const overdueMaintenance = activeWorkOrders.filter((workOrder) => {
  if (!workOrder.due_date) {
    return false;
  }

  const dueDate = new Date(`${workOrder.due_date}T00:00:00`);

  return dueDate < today;
});

const highPriorityMaintenance = activeWorkOrders.filter(
  (workOrder) => workOrder.priority === "High"
);

const dueSoonMaintenance = activeWorkOrders.filter((workOrder) => {
  if (!workOrder.due_date) {
    return false;
  }

  const dueDate = new Date(`${workOrder.due_date}T00:00:00`);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  return dueDate >= today && dueDate <= sevenDaysFromNow;
});
  
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
      <header className="mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="relative min-h-[230px] overflow-hidden">
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: "url('/brand/coachella-valley-hero.jpg')",
      }}
    />

    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/20" />

    <div className="relative flex min-h-[230px] items-center px-8 py-8 md:px-12">
    <div className="flex items-center gap-0">
{/* House + wave logo */}
<div className="shrink-0">
  <img
    src="/brand/WaveLogo.png"
    alt="PropertyCarePal"
    className="h-60 w-auto object-contain md:h-64"
  />
</div>
{/* Brand text */}
<div>
  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#102A43]">
    Property Management
  </p>

  <h1 className="mt-1 text-4xl font-bold tracking-tight text-[#102A43] md:text-5xl">
    PropertyCarePal
  </h1>

  <p className="mt-1 text-sm text-gray-500 md:text-base">
    Property Management made simple.
  </p>
</div>

</div>
    </div>
  </div>
</header>
  <section className="grid gap-5 md:grid-cols-3">
  <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Properties
        </p>

        <p className="mt-4 text-4xl font-bold tracking-tight text-[#102A43]">
          {propertyCount}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Active properties managed
        </p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
  <HouseIcon />
</div>
    </div>
  </div>

  <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Service Requests
        </p>

        <p className="mt-4 text-4xl font-bold tracking-tight text-[#102A43]">
          {activeWorkOrders.length}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Active maintenance items
        </p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
  <WrenchIcon />
</div>
    </div>
  </div>

  <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Assets
        </p>

        <p className="mt-4 text-4xl font-bold tracking-tight text-[#102A43]">
          {assetCount}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Tracked property assets
        </p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
  <GearIcon />
</div>
    </div>
  </div>
</section>
  
<section className="mt-8">
  <div className="mb-4">
    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
      Maintenance Attention
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Items that may need your attention
    </p>
  </div>

  <div className="grid gap-5 md:grid-cols-3">
    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-red-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-red-700">
            Overdue
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {overdueMaintenance.length}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Active maintenance items past their due date
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 9v3.75m0 3.75h.008M10.29 3.86 1.82 18a1.875 1.875 0 0 0 1.61 2.812h17.14A1.875 1.875 0 0 0 22.18 18L13.71 3.86a1.875 1.875 0 0 0-3.42 0Z"
  />
</svg>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-red-700">
        View work orders →
      </p>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-orange-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-700">
            High Priority
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {highPriorityMaintenance.length}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Active high-priority maintenance items
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 9v3.75m0 3.75h.008M10.29 3.86 1.82 18a1.875 1.875 0 0 0 1.61 2.812h17.14A1.875 1.875 0 0 0 22.18 18L13.71 3.86a1.875 1.875 0 0 0-3.42 0Z"
  />
</svg>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-orange-700">
        View work orders →
      </p>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-yellow-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-yellow-700">
            Due Soon
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {dueSoonMaintenance.length}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Active maintenance due within 7 days
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 6v6l4 2"
  />
  <circle
    cx="12"
    cy="12"
    r="9"
  />
</svg>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-yellow-700">
        View work orders →
      </p>
    </button>
  </div>
</section>
<section className="mt-8">
  <div className="mb-4">
    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
      Maintenance Status
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Current status of your maintenance work orders
    </p>
  </div>

  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-blue-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">
            Open
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {openWorkOrders.length}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Work orders
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 6v12m6-6H6"
  />
</svg>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-blue-700">
        View work orders →
      </p>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-orange-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-700">
            In Progress
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {inProgressWorkOrders.length}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Work orders
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M4.5 12h15m-7.5-7.5L19.5 12 12 19.5"
  />
</svg>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-orange-700">
        View work orders →
      </p>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-green-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green-700">
            Completed
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {completedWorkOrders.length}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Work orders
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="m5 12 4 4L19 6"
  />
</svg>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-green-700">
        View work orders →
      </p>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-600">
            Cancelled
          </p>

          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {cancelledWorkOrders.length}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Work orders
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M6 6l12 12M18 6 6 18"
  />
</svg>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-gray-600">
        View work orders →
      </p>
    </button>
  </div>
</section>
      
<section className="mt-8">
  <div className="mb-4">
    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
      Recent Maintenance Activity
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Recently completed maintenance work
    </p>
  </div>

  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    {recentMaintenanceWorkOrders.length === 0 ? (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          No completed maintenance activity yet.
        </p>
      </div>
    ) : (
      <div className="divide-y divide-gray-100">
        {recentMaintenanceWorkOrders.map((workOrder) => (
          <button
            key={workOrder.id}
            type="button"
            onClick={() =>
              router.push(`/work-orders/${workOrder.id}`)
            }
            className="group flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="m5 12 4 4L19 6"
  />
</svg>
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">
                  {workOrder.title}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Completed{" "}
                  {formatCompletedDate(workOrder.completed_at)}
                </p>
              </div>
            </div>

            <span className="shrink-0 text-sm font-semibold text-[#102A43] transition-colors group-hover:text-blue-700">
              View →
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
</section>
<section className="mt-8">
  <div className="mb-4">
    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
      Upcoming Maintenance Calendar
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Maintenance scheduled over the next 7 days
    </p>
  </div>

  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    {upcomingMaintenanceByDate.length === 0 ? (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          No upcoming maintenance scheduled.
        </p>
      </div>
    ) : (
      <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
        {upcomingMaintenanceByDate.map((workOrder) => (
          <button
            key={workOrder.id}
            type="button"
            onClick={() =>
              router.push(`/work-orders/${workOrder.id}`)
            }
            className="group rounded-xl border border-gray-200 bg-gray-50 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M11 3.5a8.5 8.5 0 0 0 0 17h1.5a8.5 8.5 0 0 0 0-17H11Zm0 0v5m0 0h5"
  />
</svg>
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {workOrder.title}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Due {formatDate(workOrder.due_date)}
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-sm font-semibold text-[#102A43] transition-colors group-hover:text-blue-700">
                View →
              </span>
            </div>

            {workOrder.priority && (
              <div className="mt-4">
                <span className="inline-flex rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {workOrder.priority} priority
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    )}
    </div>
</section>

<section className="mt-8">
  <div className="mb-4">
    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
      Property Activity
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Properties with active maintenance work
    </p>
  </div>

  {Object.keys(propertyActivity).length === 0 ? (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="m2.25 12 9.75-9 9.75 9M4.5 10.5V21h15V10.5M9 21v-6h6v6"
  />
</svg>
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            No active maintenance
          </p>

          <p className="mt-1 text-sm text-gray-500">
            No properties currently have active maintenance work.
          </p>
        </div>
      </div>
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
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
  <HouseIcon />
</div>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">
                    {activity.propertyName}
                  </h3>

                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Property
                  </p>
                </div>
              </div>

              {activity.overdueCount > 0 && (
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  {activity.overdueCount} overdue
                </span>
              )}
            </div>

            <div className="mt-5">
              <p className="text-3xl font-bold tracking-tight text-gray-900">
                {activity.activeCount}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Active maintenance{" "}
                {activity.activeCount === 1 ? "item" : "items"}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm font-medium text-gray-500">
                View property
              </span>

              <span className="text-sm font-semibold text-[#102A43] transition-colors group-hover:text-blue-700">
                View →
              </span>
            </div>
          </button>
        ))}
    </div>
  )}
</section>
       
<section className="mt-8">
  <div className="mb-4">
    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
      Quick Actions
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Quickly access common property management tasks
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-3">
    <button
      type="button"
      onClick={() => router.push("/properties")}
      className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"
  />
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 10v6m-3-3h6"
  />
</svg>
          </div>

          <h3 className="mt-4 font-semibold text-gray-900">
            Add Property
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Add a new property to your portfolio.
          </p>
        </div>

        <span className="text-sm font-semibold text-[#102A43] transition-colors group-hover:text-blue-700">
          →
        </span>
      </div>
    </button>

    <button
      type="button"
      onClick={() => router.push("/work-orders")}
      className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M14.7 6.3a5 5 0 0 0-6.4 6.4l-5.1 5.1a1.4 1.4 0 0 0 2 2l5.1-5.1a5 5 0 0 0 6.4-6.4l-3 3-2-2 3-3Z"
  />
</svg>
          </div>

          <h3 className="mt-4 font-semibold text-gray-900">
            Create Work Order
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage maintenance work.
          </p>
        </div>

        <span className="text-sm font-semibold text-[#102A43] transition-colors group-hover:text-blue-700">
          →
        </span>
      </div>
    </button>

    <button
      type="button"
      onClick={() => router.push("/assets")}
      className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="h-5 w-5"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M10.3 3.2 9.7 5a7.9 7.9 0 0 0-1.8 1l-1.8-.6-1.4 1.4.6 1.8a7.9 7.9 0 0 0-1 1.8l-1.8.6v2l1.8.6a7.9 7.9 0 0 0 1 1.8l-.6 1.8 1.4 1.4 1.8-.6a7.9 7.9 0 0 0 1.8 1l.6 1.8h2l.6-1.8a7.9 7.9 0 0 0 1.8-1l1.8.6 1.4-1.4-.6-1.8a7.9 7.9 0 0 0 1-1.8l1.8-.6v-2l-1.8-.6a7.9 7.9 0 0 0-1-1.8l.6-1.8-1.4-1.4-1.8.6a7.9 7.9 0 0 0-1.8-1l-.6-1.8h-2Z"
  />
  <circle cx="11.3" cy="12" r="2.5" />
</svg>
          </div>

          <h3 className="mt-4 font-semibold text-gray-900">
            View Assets
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Review and manage property assets.
          </p>
        </div>

        <span className="text-sm font-semibold text-[#102A43] transition-colors group-hover:text-blue-700">
          →
        </span>
      </div>
    </button>
  </div>
</section>
      </div>
    </AppLayout>
  );
}