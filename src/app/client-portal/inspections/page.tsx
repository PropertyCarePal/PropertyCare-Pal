
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import ClientSidebar from "@/components/ClientSidebar";

type Inspection = {
  id: string;
  property_id: string;
  scheduled_date: string | null;
  completed_at: string | null;
  status: string | null;
  notes: string | null;
  properties?: { name: string } | { name: string }[] | null;
};

type InspectionItem = {
  id: string;
  inspection_id: string;
  name: string;
  description: string | null;
  category: string | null;
  result: string | null;
  notes: string | null;
  completed_at: string | null;
};

type InspectionPhoto = {
  id: string;
  inspection_id: string;
  inspection_item_id: string | null;
  storage_path: string;
  caption: string | null;
  signedUrl: string | null;
};

function formatResult(result: string | null) {
  switch (result) {
    case "pass":
      return "Pass";
    case "needs_attention":
      return "Needs Attention";
    case "failed":
      return "Failed";
    case "not_applicable":
      return "Not Applicable";
    default:
      return "Not Completed";
  }
}

function resultStyle(result: string | null) {
  switch (result) {
    case "pass":
      return "bg-green-100 text-green-800";
    case "needs_attention":
      return "bg-amber-100 text-amber-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}


function formatDate(date: string | null) {
  if (!date) return "Not specified";

  let parsedDate: Date;

  if (date.length === 10) {
    parsedDate = new Date(date + "T00:00:00");
  } else {
    parsedDate = new Date(date);
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}


export default function ClientInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const calendarDays = (() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  })();

  function getInspectionsForDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    return inspections.filter(
      (inspection) => inspection.scheduled_date?.slice(0, 10) === dateString
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
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function goToInspection(inspectionId: string) {
    document.getElementById(`inspection-${inspectionId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInspections() {
      const supabase = getSupabaseClient();

      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setError("Please sign in to view your inspections.");
          return;
        }

        const { data: propertyAccess, error: accessError } =
          await supabase
            .from("client_properties")
            .select("property_id")
            .eq("profile_id", user.id);

        if (accessError) throw accessError;

        const propertyIds = [
          ...new Set(
            (propertyAccess ?? []).map((access) => access.property_id)
          ),
        ];

        if (propertyIds.length === 0) {
          if (!cancelled) {
            setInspections([]);
            setInspectionItems([]);
            setPhotos([]);
          }
          return;
        }

        const { data: inspectionData, error: inspectionError } =
          await supabase
            .from("inspections")
            .select(`
              id,
              property_id,
              scheduled_date,
              completed_at,
              status,
              notes,
              properties (
                name
              )
            `)
            .in("property_id", propertyIds)
            .order("scheduled_date", { ascending: false });

        if (inspectionError) throw inspectionError;

        const loadedInspections = inspectionData ?? [];

        if (cancelled) return;
        setInspections(loadedInspections);

        const inspectionIds = loadedInspections.map(
          (inspection) => inspection.id
        );

        if (inspectionIds.length === 0) {
          if (!cancelled) {
            setInspectionItems([]);
            setPhotos([]);
          }
          return;
        }

        const { data: itemData, error: itemError } = await supabase
          .from("inspection_items")
          .select(
            "id, inspection_id, name, description, category, result, notes, completed_at"
          )
          .in("inspection_id", inspectionIds)
          .order("sort_order", { ascending: true });

        if (itemError) throw itemError;

        if (cancelled) return;
        setInspectionItems(itemData ?? []);

        const { data: photoData, error: photoError } = await supabase
          .from("inspection_photos")
          .select(
            "id, inspection_id, inspection_item_id, storage_path, caption, created_at"
          )
          .in("inspection_id", inspectionIds)
          .order("created_at", { ascending: true });

        if (photoError) throw photoError;

        const photosWithUrls: InspectionPhoto[] = [];

        for (const photo of photoData ?? []) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("inspection-photos")
              .createSignedUrl(photo.storage_path, 3600);

          photosWithUrls.push({
            id: photo.id,
            inspection_id: photo.inspection_id,
            inspection_item_id: photo.inspection_item_id,
            storage_path: photo.storage_path,
            caption: photo.caption,
            signedUrl: signedError ? null : signedData?.signedUrl ?? null,
          });
        }

        if (!cancelled) {
          setPhotos(photosWithUrls);
        }
      } catch (err) {
        console.error("CLIENT INSPECTIONS ERROR:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load inspections."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInspections();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ClientSidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
              PropertyCare Pal
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              My Inspections
            </h1>

            <p className="mt-2 text-gray-600">
              Review property inspection reports, checklist results, and
              photos.
            </p>
                      <div className="mb-8 overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Inspection Calendar
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  View scheduled and completed property inspections.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>

              <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-blue-100" />
                  Scheduled
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-gray-200" />
                  Completed
                </span>
              </div>

              <div className="grid grid-cols-7 border-l border-t border-gray-200">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="border-b border-r border-gray-200 bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 sm:p-3"
                    >
                      {day}
                    </div>
                  )
                )}

                {calendarDays.map((date, index) => {
                  const dayInspections = date
                    ? getInspectionsForDate(date)
                    : [];

                  return (
                    <div
                      key={index}
                      className="min-h-[100px] border-b border-r border-gray-200 p-1.5 sm:min-h-[120px] sm:p-2"
                    >
                      {date && (
                        <>
                          <div
                            className={
                              "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold " +
                              (isToday(date)
                                ? "bg-[#102A43] text-white"
                                : "text-gray-700")
                            }
                          >
                            {date.getDate()}
                          </div>

                          <div className="space-y-1">
                            {dayInspections.map((inspection) => {
                              const completed =
                                (inspection.status ?? "").toLowerCase() ===
                                  "completed" ||
                                inspection.completed_at !== null;

                              const propertyName = Array.isArray(
                                inspection.properties
                              )
                                ? inspection.properties[0]?.name
                                : inspection.properties?.name;

                              return (
                                <button
                                  key={inspection.id}
                                  type="button"
                                  onClick={() =>
                                    goToInspection(inspection.id)
                                  }
                                  title={`${propertyName || "Property Inspection"} — ${inspection.status || "Scheduled"}`}
                                  className={
                                    "block w-full rounded-md px-2 py-1.5 text-left transition " +
                                    (completed
                                      ? "bg-gray-200 text-gray-500 line-through hover:bg-gray-300"
                                      : "bg-blue-50 text-blue-900 hover:bg-blue-100")
                                  }
                                >
                                  <p className="truncate text-xs font-semibold">
                                    {propertyName || "Property Inspection"}
                                  </p>
                                  <p className="truncate text-[11px]">
                                    {completed
                                      ? "Completed"
                                      : inspection.status || "Scheduled"}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          </div>

          {loading ? (
            <div className="rounded-xl bg-white p-8 text-gray-600 shadow-sm">
              Loading your inspections...
            </div>
          ) : error ? (
            <div className="rounded-xl bg-white p-6 text-red-700 shadow-sm">
              {error}
            </div>
          ) : inspections.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                No inspections available yet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Scheduled and completed inspections for your property will
                appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {inspections.map((inspection) => {
                const items = inspectionItems.filter(
                  (item) => item.inspection_id === inspection.id
                );

                return (
                  <section
  id={`inspection-${inspection.id}`}
  key={inspection.id}
  className="scroll-mt-6 overflow-hidden rounded-xl bg-white shadow-sm"
>
                    <div className="border-b border-gray-200 p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                        <h2 className="text-xl font-bold text-gray-900">
  {Array.isArray(inspection.properties)
    ? inspection.properties[0]?.name || "Property Inspection"
    : inspection.properties?.name || "Property Inspection"}
</h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Scheduled: {formatDate(inspection.scheduled_date)}
                          </p>

                          {inspection.completed_at && (
                            <p className="mt-1 text-sm text-gray-500">
                              Completed: {formatDate(inspection.completed_at)}
                            </p>
                          )}
                        </div>

                        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                          {inspection.status || "Scheduled"}
                        </span>
                      </div>

                      {inspection.notes && (
                        <div className="mt-4 rounded-lg bg-gray-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Inspection Notes
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {inspection.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">
                        Checklist Results
                      </h3>

                      {items.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No checklist results have been recorded for this
                          inspection.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {items.map((item) => {
                            const itemPhotos = photos.filter(
                              (photo) =>
                                photo.inspection_item_id === item.id
                            );

                            return (
                              <div
                                key={item.id}
                                className="rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    {item.category && (
                                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        {item.category}
                                      </p>
                                    )}

                                    <h4 className="mt-1 font-semibold text-gray-900">
                                      {item.name}
                                    </h4>

                                    {item.description && (
                                      <p className="mt-1 text-sm text-gray-600">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>

                                  <span
                                    className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${resultStyle(item.result)}`}
                                  >
                                    {formatResult(item.result)}
                                  </span>
                                </div>

                                {item.notes && (
                                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                                    {item.notes}
                                  </p>
                                )}

                                {itemPhotos.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="mb-3 text-sm font-semibold text-gray-800">
                                      Inspection Photos
                                    </h5>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                      {itemPhotos.map((photo) => (
                                        <div
                                          key={photo.id}
                                          className="overflow-hidden rounded-lg border border-gray-200"
                                        >
                                          {photo.signedUrl ? (
                                            <a
                                              href={photo.signedUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="block"
                                            >
                                              <img
                                                src={photo.signedUrl}
                                                alt={
                                                  photo.caption ||
                                                  `Inspection photo for ${item.name}`
                                                }
                                                className="h-48 w-full object-cover"
                                              />
                                            </a>
                                          ) : (
                                            <p className="p-4 text-sm text-gray-500">
                                              Photo unavailable
                                            </p>
                                          )}

                                          {photo.caption && (
                                            <p className="p-3 text-sm text-gray-600">
                                              {photo.caption}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
