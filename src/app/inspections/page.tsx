"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

type Inspection = {
  id: string;
  property_id: string;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  notes: string | null;
  property: {
    name: string;
  } | null;
};

export default function InspectionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    loadInspections();
  }, [user, authLoading, router]);

  async function loadInspections() {
    try {
      setLoading(true);
      setError("");

      const supabase = getSupabaseClient();

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user?.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.organization_id) {
        throw new Error("Your account is not connected to an organization.");
      }

      const { data, error: inspectionsError } = await supabase
        .from("inspections")
        .select(
          `
          id,
          property_id,
          scheduled_date,
          completed_at,
          status,
          notes,
          properties (
            name
          )
        `
        )
        .eq("organization_id", profile.organization_id)
        .order("scheduled_date", { ascending: true });

      if (inspectionsError) {
        throw inspectionsError;
      }

      const formattedInspections: Inspection[] = (data || []).map(
        (inspection: any) => ({
          id: inspection.id,
          property_id: inspection.property_id,
          scheduled_date: inspection.scheduled_date,
          completed_at: inspection.completed_at,
          status: inspection.status,
          notes: inspection.notes,
          property: inspection.properties
            ? {
                name: inspection.properties.name,
              }
            : null,
        })
      );

      setInspections(formattedInspections);
    } catch (err: any) {
      console.error("Error loading inspections:", err);
      setError(err?.message || "Unable to load inspections.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "in_progress":
        return "bg-blue-100 text-blue-700";

      case "cancelled":
        return "bg-gray-100 text-gray-600";

      case "scheduled":
      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  function formatStatus(status: string) {
    switch (status) {
      case "in_progress":
        return "In Progress";

      case "completed":
        return "Completed";

      case "cancelled":
        return "Cancelled";

      case "scheduled":
      default:
        return "Scheduled";
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inspections
            </h1>

            <p className="mt-2 text-gray-600">
              Manage property inspections, checklists, photos, and follow-up
              work.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadInspections()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Inspections
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {inspections.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Scheduled
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {inspections.filter(
                (inspection) => inspection.status === "scheduled"
              ).length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {inspections.filter(
                (inspection) => inspection.status === "completed"
              ).length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Inspection Schedule
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading inspections...
            </div>
          ) : inspections.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No inspections yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Inspection visits will appear here once they are scheduled.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {inspections.map((inspection) => (
                <button
                  key={inspection.id}
                  type="button"
                  onClick={() =>
                    router.push(`/inspections/${inspection.id}`)
                  }
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900">
                      {inspection.property?.name || "Property"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Scheduled for {formatDate(inspection.scheduled_date)}
                    </p>

                    {inspection.notes && (
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {inspection.notes}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex flex-shrink-0 items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                        inspection.status
                      )}`}
                    >
                      {formatStatus(inspection.status)}
                    </span>

                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}