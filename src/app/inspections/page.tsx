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

type Property = {
  id: string;
  name: string;
};

type InspectionTemplate = {
  id: string;
  name: string;
  package_type: string | null;
  monthly_price: number | null;
  visits_per_month: number;
};

type Inspector = {
  id: string;
  full_name: string | null;
  role: string | null;
};

export default function InspectionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedInspectorId, setSelectedInspectorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    loadPageData();
  }, [user, authLoading, router]);

  async function loadPageData() {
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

      const organizationId = profile.organization_id;

      const [
        inspectionsResult,
        propertiesResult,
        templatesResult,
        inspectorsResult,
      ] = await Promise.all([
        supabase
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
          .eq("organization_id", organizationId)
          .order("scheduled_date", { ascending: true }),

        supabase
          .from("properties")
          .select("id, name")
          .eq("organization_id", organizationId)
          .eq("status", "Active")
          .order("name", { ascending: true }),

        supabase
          .from("inspection_templates")
          .select(
            "id, name, package_type, monthly_price, visits_per_month"
          )
          .eq("organization_id", organizationId)
          .eq("is_active", true)
          .order("name", { ascending: true }),

        supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("organization_id", organizationId)
          .order("full_name", { ascending: true }),
      ]);

      if (inspectionsResult.error) {
        throw inspectionsResult.error;
      }

      if (propertiesResult.error) {
        throw propertiesResult.error;
      }

      if (templatesResult.error) {
        throw templatesResult.error;
      }

      if (inspectorsResult.error) {
        throw inspectorsResult.error;
      }

      const formattedInspections: Inspection[] = (
        inspectionsResult.data || []
      ).map((inspection: any) => ({
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
      }));

      setInspections(formattedInspections);
      setProperties(propertiesResult.data || []);
      setTemplates(templatesResult.data || []);
      setInspectors(inspectorsResult.data || []);
    } catch (err: any) {
      console.error("Error loading inspections:", err);
      setError(err?.message || "Unable to load inspections.");
    } finally {
      setLoading(false);
    }
  }

  function openScheduleModal() {
    setError("");

    setSelectedPropertyId(
      properties.length === 1 ? properties[0].id : ""
    );

    setSelectedTemplateId(
      templates.length === 1 ? templates[0].id : ""
    );

    setSelectedInspectorId("");

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    setScheduledDate(`${year}-${month}-${day}`);

    setShowScheduleModal(true);
  }

  function closeScheduleModal() {
    if (saving) return;

    setShowScheduleModal(false);
  }

  async function scheduleInspection() {
    if (!selectedPropertyId) {
      setError("Please select a property.");
      return;
    }

    if (!selectedTemplateId) {
      setError("Please select an inspection package.");
      return;
    }

    if (!scheduledDate) {
      setError("Please select an inspection date.");
      return;
    }

    if (!user?.id) {
      setError("You must be logged in to schedule an inspection.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const supabase = getSupabaseClient();

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.organization_id) {
        throw new Error("Your account is not connected to an organization.");
      }

      const organizationId = profile.organization_id;

      /*
       * First create the inspection itself.
       */
      const { data: newInspection, error: inspectionError } =
        await supabase
          .from("inspections")
          .insert({
            organization_id: organizationId,
            property_id: selectedPropertyId,
            template_id: selectedTemplateId,
            inspector_id: selectedInspectorId || null,
            scheduled_date: scheduledDate,
            status: "scheduled",
          })
          .select("id")
          .single();

      if (inspectionError) {
        throw inspectionError;
      }

      if (!newInspection?.id) {
        throw new Error("The inspection could not be created.");
      }

      /*
       * Get the checklist items from the selected package.
       */
      const { data: templateItems, error: templateItemsError } =
        await supabase
          .from("inspection_template_items")
          .select(
            `
            id,
            name,
            description,
            category,
            sort_order
          `
          )
          .eq("template_id", selectedTemplateId)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

      if (templateItemsError) {
        await supabase
          .from("inspections")
          .delete()
          .eq("id", newInspection.id);

        throw templateItemsError;
      }

      /*
       * Create the inspection checklist snapshot.
       */
      if (templateItems && templateItems.length > 0) {
        const inspectionItems = templateItems.map((item) => ({
          inspection_id: newInspection.id,
          template_item_id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          sort_order: item.sort_order,
        }));

        const { error: inspectionItemsError } = await supabase
          .from("inspection_items")
          .insert(inspectionItems);

        if (inspectionItemsError) {
          await supabase
            .from("inspections")
            .delete()
            .eq("id", newInspection.id);

          throw inspectionItemsError;
        }
      }

      /*
       * Close the modal and refresh the inspection schedule.
       */
      setShowScheduleModal(false);

      setSelectedPropertyId("");
      setSelectedTemplateId("");
      setSelectedInspectorId("");
      setScheduledDate("");

      await loadPageData();
    } catch (err: any) {
      console.error("Error scheduling inspection:", err);
      setError(err?.message || "Unable to schedule inspection.");
    } finally {
      setSaving(false);
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openScheduleModal}
              className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#163A5C]"
            >
              Schedule Inspection
            </button>

            <button
              type="button"
              onClick={() => loadPageData()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
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
              {
                inspections.filter(
                  (inspection) => inspection.status === "scheduled"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {
                inspections.filter(
                  (inspection) => inspection.status === "completed"
                ).length
              }
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

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900">
                Schedule Inspection
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Schedule a property inspection using one of your inspection
                packages.
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label
                  htmlFor="inspection-property"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Property
                </label>

                <select
                  id="inspection-property"
                  value={selectedPropertyId}
                  onChange={(event) =>
                    setSelectedPropertyId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                >
                  <option value="">Select a property</option>

                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>

                {properties.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No active properties are available.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="inspection-package"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Inspection Package
                </label>

                <select
                  id="inspection-package"
                  value={selectedTemplateId}
                  onChange={(event) =>
                    setSelectedTemplateId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                >
                  <option value="">Select an inspection package</option>

                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.package_type
                        ? ` — ${template.package_type}`
                        : ""}
                    </option>
                  ))}
                </select>

                {templates.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No active inspection packages are available. Create a
                    package first.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="inspection-inspector"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Inspector
                  <span className="ml-1 font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <select
                  id="inspection-inspector"
                  value={selectedInspectorId}
                  onChange={(event) =>
                    setSelectedInspectorId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                >
                  <option value="">Assign later</option>

                  {inspectors.map((inspector) => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.full_name || "Team Member"}
                      {inspector.role ? ` — ${inspector.role}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="inspection-date"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Inspection Date
                </label>

                <input
                  id="inspection-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(event) =>
                    setScheduledDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closeScheduleModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={scheduleInspection}
                disabled={
                  saving ||
                  properties.length === 0 ||
                  templates.length === 0
                }
                className="rounded-lg bg-[#102A43] px-5 py-2 text-sm font-medium text-white hover:bg-[#163A5C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Scheduling..." : "Schedule Inspection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}