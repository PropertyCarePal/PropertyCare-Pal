"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import ClientSidebar from "@/components/ClientSidebar";

type Property = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  property_type: string | null;
  status: string | null;
};

type WorkOrder = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  property_id: string;
};

export default function ClientPortalPage() {
  const supabase = getSupabaseClient();

  const [property, setProperty] = useState<Property | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    async function loadPropertyAndCalendar() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view this page.");
          setLoading(false);
          return;
        }

        const { data: access, error: accessError } = await supabase
          .from("client_properties")
          .select("property_id")
          .eq("profile_id", user.id)
          .limit(1)
          .maybeSingle();

        if (accessError) {
          throw accessError;
        }

        if (!access) {
          setError("No property has been assigned to your account.");
          setLoading(false);
          return;
        }

        const { data: propertyData, error: propertyError } =
          await supabase
            .from("properties")
            .select(
              "id, name, address, city, state, property_type, status"
            )
            .eq("id", access.property_id)
            .single();

        if (propertyError) {
          throw propertyError;
        }

        setProperty(propertyData);

        const { data: workOrderData, error: workOrderError } =
          await supabase
            .from("work_orders")
            .select(
              "id, title, status, priority, due_date, property_id"
            )
            .eq("property_id", access.property_id)
            .order("due_date", { ascending: true });

        if (workOrderError) {
          throw workOrderError;
        }

        setWorkOrders(workOrderData ?? []);
      } catch (err) {
        console.error("CLIENT PORTAL ERROR:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your property information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPropertyAndCalendar();
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [currentMonth]);

  function getWorkOrdersForDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${day}`;

    return workOrders.filter(
      (workOrder) => workOrder.due_date === dateString
    );
  }

  function isToday(date: Date) {
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  }

  function goToToday() {
    const today = new Date();

    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex flex-1 items-center justify-center">
          <p className="text-gray-600">
            Loading your property...
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
                Client Portal
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ClientSidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-8 py-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Property
            </h1>

            <p className="text-sm text-gray-500">
              Welcome to your PropertyCare Pal client portal
            </p>
          </div>

          <div className="flex items-center gap-4">
  <div className="text-right">
    <p className="text-sm font-medium text-gray-900">
      Property Owner
    </p>
    <p className="text-xs text-gray-500">Client Portal</p>
  </div>

  <button
    onClick={async () => {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }}
    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
  >
    Logout
  </button>
</div>
        </header>

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">

            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                Property Overview
              </p>

              <h2 className="mt-1 text-3xl font-bold text-gray-900">
                Welcome to Your Property Portal
              </h2>

              <p className="mt-2 text-gray-600">
                View your property schedule, maintenance activity,
                and important updates.
              </p>
            </div>

            {property && (
              <>
              {/* PROPERTY INFORMATION */}
              <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Your Property
                      </p>

                      <h3 className="mt-1 text-2xl font-bold text-gray-900">
                        {property.name}
                      </h3>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                      {property.status ?? "Active"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Address
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {property.address ||
                          "Address not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Location
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {[property.city, property.state]
                          .filter(Boolean)
                          .join(", ") ||
                          "Location not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Property Type
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {property.property_type ||
                          "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CALENDAR */}
                <div className="rounded-xl bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                        Property Calendar
                      </p>

                      <h3 className="mt-1 text-2xl font-bold text-gray-900">
                        {currentMonth.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Scheduled maintenance and property activity
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={previousMonth}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ←
                      </button>

                      <button
                        onClick={goToToday}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Today
                      </button>

                      <button
                        onClick={nextMonth}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6">
                    <div className="grid grid-cols-7 border-l border-t border-gray-200">
                      {[
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ].map((day) => (
                        <div
                          key={day}
                          className="border-b border-r border-gray-200 bg-gray-50 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {day}
                        </div>
                      ))}

                      {calendarDays.map((date, index) => {
                        const dayWorkOrders = date
                          ? getWorkOrdersForDate(date)
                          : [];

                        return (
                          <div
                            key={index}
                            className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                              date
                                ? "bg-white"
                                : "bg-gray-50"
                            }`}
                          >
                            {date && (
                              <>
                                <div
                                  className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                                    isToday(date)
                                      ? "bg-blue-600 text-white"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {date.getDate()}
                                </div>

                                <div className="space-y-1">
                                  {dayWorkOrders.map(
                                    (workOrder) => (
                                      <div
                                        key={workOrder.id}
                                        className="rounded-md bg-blue-50 px-2 py-1.5"
                                      >
                                        <p className="truncate text-xs font-semibold text-blue-800">
                                          {workOrder.title}
                                        </p>

                                        <p className="text-[11px] text-blue-600">
                                          {workOrder.status ||
                                            "Scheduled"}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>


                {/* PORTAL SECTIONS */}
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      Work Orders
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-gray-900">
                      Maintenance
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      View current and completed maintenance
                      requests.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      Inspections
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-gray-900">
                      Property Checks
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Review inspections and property reports.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      Documents
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-gray-900">
                      Property Files
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Access important property-related documents.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}