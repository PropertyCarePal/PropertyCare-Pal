"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseClient } from "@/lib/supabase";

type Inspection = {
  id: string;
  property_id: string;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  notes: string | null;
  property: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  } | null;
};

type InspectionItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sort_order: number;
  result: string | null;
  notes: string | null;
};

type InspectionPhoto = {
  id: string;
  inspection_id: string;
  inspection_item_id: string | null;
  storage_path: string;
  caption: string | null;
  created_at: string;
  signedUrl: string | null;
};

type InspectionWorkOrder = {
  id: string;
  inspection_id: string;
  inspection_item_id: string | null;
  work_order_id: string;
  work_order: {
    id: string;
    status: string;
    priority: string;
  } | null;
};

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const inspectionId = params.id as string;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [workOrderLinks, setWorkOrderLinks] = useState<
    InspectionWorkOrder[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(
    null
  );
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (inspectionId) {
      loadInspection();
    }
  }, [user, authLoading, inspectionId, router]);

  async function loadInspection() {
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

      const { data: inspectionData, error: inspectionError } =
        await supabase
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
              name,
              address,
              city,
              state,
              zip_code
            )
          `
          )
          .eq("id", inspectionId)
          .eq("organization_id", profile.organization_id)
          .single();

      if (inspectionError) {
        throw inspectionError;
      }

      const formattedInspection: Inspection = {
        id: inspectionData.id,
        property_id: inspectionData.property_id,
        scheduled_date: inspectionData.scheduled_date,
        completed_at: inspectionData.completed_at,
        status: inspectionData.status,
        notes: inspectionData.notes,
        property: inspectionData.properties
          ? {
              name: inspectionData.properties.name,
              address: inspectionData.properties.address,
              city: inspectionData.properties.city,
              state: inspectionData.properties.state,
              zip_code: inspectionData.properties.zip_code,
            }
          : null,
      };

      const { data: itemData, error: itemsError } = await supabase
        .from("inspection_items")
        .select(
          `
          id,
          name,
          description,
          category,
          sort_order,
          result,
          notes
        `
        )
        .eq("inspection_id", inspectionId)
        .order("sort_order", { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      setInspection(formattedInspection);
      setItems(itemData || []);

      await loadPhotos();
      await loadWorkOrderLinks();
    } catch (err: any) {
      console.error("Error loading inspection:", err);
      setError(err?.message || "Unable to load inspection.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPhotos() {
    const supabase = getSupabaseClient();

    const { data, error: photosError } = await supabase
      .from("inspection_photos")
      .select(
        `
        id,
        inspection_id,
        inspection_item_id,
        storage_path,
        caption,
        created_at
      `
      )
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: true });

    if (photosError) {
      throw photosError;
    }

    const photosWithUrls: InspectionPhoto[] = [];

    for (const photo of data || []) {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("inspection-photos")
          .createSignedUrl(photo.storage_path, 60 * 60);

      photosWithUrls.push({
        ...photo,
        signedUrl: signedUrlError
          ? null
          : signedUrlData?.signedUrl || null,
      });
    }

    setPhotos(photosWithUrls);
  }

  async function loadWorkOrderLinks() {
    const supabase = getSupabaseClient();

    const { data, error: workOrderError } = await supabase
      .from("inspection_work_orders")
      .select(
        `
        id,
        inspection_id,
        inspection_item_id,
        work_order_id,
        work_orders (
          id,
          status,
          priority
        )
      `
      )
      .eq("inspection_id", inspectionId);

    if (workOrderError) {
      throw workOrderError;
    }

    const formattedLinks: InspectionWorkOrder[] = (data || []).map(
      (link: any) => ({
        id: link.id,
        inspection_id: link.inspection_id,
        inspection_item_id: link.inspection_item_id,
        work_order_id: link.work_order_id,
        work_order: Array.isArray(link.work_orders)
          ? link.work_orders[0]
            ? {
                id: link.work_orders[0].id,
                status: link.work_orders[0].status,
                priority: link.work_orders[0].priority,
              }
            : null
          : link.work_orders
            ? {
                id: link.work_orders.id,
                status: link.work_orders.status,
                priority: link.work_orders.priority,
              }
            : null,
      })
    );

    setWorkOrderLinks(formattedLinks);
  }

  function getWorkOrderForItem(itemId: string) {
    return workOrderLinks.find(
      (link) => link.inspection_item_id === itemId
    );
  }

  async function createWorkOrder(item: InspectionItem) {
    if (
      item.result !== "failed" &&
      item.result !== "needs_attention"
    ) {
      return;
    }

    if (!inspection) return;

    const existingLink = getWorkOrderForItem(item.id);

    if (existingLink) {
      setSuccess(
        `Work order already exists for "${item.name}".`
      );
      setError("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

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
        throw new Error(
          "Your account is not connected to an organization."
        );
      }

      const priority =
        item.result === "failed" ? "Urgent" : "High";

      const propertyName =
        inspection.property?.name || "Property";

      const resultLabel =
        item.result === "failed"
          ? "Failed"
          : "Needs Attention";

      const descriptionParts = [
        `Created from inspection at ${propertyName}.`,
        `Inspection item: ${item.name}.`,
        `Inspection result: ${resultLabel}.`,
      ];

      if (item.description) {
        descriptionParts.push(`Item description: ${item.description}`);
      }

      if (item.notes) {
        descriptionParts.push(`Inspection notes: ${item.notes}`);
      }

      const { data: workOrder, error: workOrderError } = await supabase
        .from("work_orders")
        .insert({
          organization_id: profile.organization_id,
          property_id: inspection.property_id,
          title: `Inspection: ${item.name}`,
          description: descriptionParts.join("\n"),
          status: "Open",
          priority,
          assigned_to: null,
          due_date: null,
          estimated_cost: null,
          actual_cost: null,
          completion_notes: null,
          assigned_user_id: null,
        })
        .select("id, status, priority")
        .single();

      if (workOrderError) {
        throw workOrderError;
      }

      const { data: link, error: linkError } = await supabase
        .from("inspection_work_orders")
        .insert({
          inspection_id: inspection.id,
          inspection_item_id: item.id,
          work_order_id: workOrder.id,
        })
        .select("id, inspection_id, inspection_item_id, work_order_id")
        .single();

      if (linkError) {
        await supabase
          .from("work_orders")
          .delete()
          .eq("id", workOrder.id);

        throw linkError;
      }

      setWorkOrderLinks((currentLinks) => [
        ...currentLinks,
        {
          id: link.id,
          inspection_id: link.inspection_id,
          inspection_item_id: link.inspection_item_id,
          work_order_id: link.work_order_id,
          work_order: {
            id: workOrder.id,
            status: workOrder.status,
            priority: workOrder.priority,
          },
        },
      ]);

      setSuccess(
        `Work order created for "${item.name}".`
      );
    } catch (err: any) {
      console.error("Error creating work order:", err);
      setError(
        err?.message || "Unable to create work order."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateItemResult(itemId: string, result: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              result: item.result === result ? null : result,
            }
          : item
      )
    );

    setSuccess("");
  }

  function updateItemNotes(itemId: string, notes: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              notes,
            }
          : item
      )
    );

    setSuccess("");
  }

  async function handlePhotoUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    itemId: string
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingItemId(itemId);
      setError("");
      setSuccess("");

      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file.");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Photo must be smaller than 10 MB.");
      }

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

      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExtension}`;

      const storagePath = `${profile.organization_id}/${inspectionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("inspection-photos")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: photoInsertError } = await supabase
        .from("inspection_photos")
        .insert({
          inspection_id: inspectionId,
          inspection_item_id: itemId,
          storage_path: storagePath,
          created_by: user?.id,
        });

      if (photoInsertError) {
        await supabase.storage
          .from("inspection-photos")
          .remove([storagePath]);

        throw photoInsertError;
      }

      await loadPhotos();

      setSuccess("Photo uploaded successfully.");
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      setError(err?.message || "Unable to upload photo.");
    } finally {
      setUploadingItemId(null);

      event.target.value = "";
    }
  }

  async function deletePhoto(photo: InspectionPhoto) {
    try {
      setDeletingPhotoId(photo.id);
      setError("");
      setSuccess("");

      const supabase = getSupabaseClient();

      const { error: storageError } = await supabase.storage
        .from("inspection-photos")
        .remove([photo.storage_path]);

      if (storageError) {
        throw storageError;
      }

      const { error: databaseError } = await supabase
        .from("inspection_photos")
        .delete()
        .eq("id", photo.id);

      if (databaseError) {
        throw databaseError;
      }

      setPhotos((currentPhotos) =>
        currentPhotos.filter((currentPhoto) => currentPhoto.id !== photo.id)
      );

      setSuccess("Photo deleted.");
    } catch (err: any) {
      console.error("Error deleting photo:", err);
      setError(err?.message || "Unable to delete photo.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function saveInspection() {
    if (!inspection) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const supabase = getSupabaseClient();

      const { error: inspectionError } = await supabase
        .from("inspections")
        .update({
          status: "in_progress",
        })
        .eq("id", inspection.id);

      if (inspectionError) {
        throw inspectionError;
      }

      for (const item of items) {
        const { error: itemError } = await supabase
          .from("inspection_items")
          .update({
            result: item.result,
            notes: item.notes,
            completed_at: item.result
              ? new Date().toISOString()
              : null,
          })
          .eq("id", item.id);

        if (itemError) {
          throw itemError;
        }
      }

      setInspection({
        ...inspection,
        status: "in_progress",
      });

      setSuccess("Inspection saved successfully.");
    } catch (err: any) {
      console.error("Error saving inspection:", err);
      setError(err?.message || "Unable to save inspection.");
    } finally {
      setSaving(false);
    }
  }

  async function completeInspection() {
    if (!inspection) return;

    const unfinishedItems = items.filter((item) => !item.result);

    if (unfinishedItems.length > 0) {
      setError(
        `Please complete all checklist items before completing the inspection. ${unfinishedItems.length} item${
          unfinishedItems.length === 1 ? "" : "s"
        } remain.`
      );

      setSuccess("");

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const supabase = getSupabaseClient();

      for (const item of items) {
        const { error: itemError } = await supabase
          .from("inspection_items")
          .update({
            result: item.result,
            notes: item.notes,
            completed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (itemError) {
          throw itemError;
        }
      }

      const completedAt = new Date().toISOString();

      const { error: inspectionError } = await supabase
        .from("inspections")
        .update({
          status: "completed",
          completed_at: completedAt,
        })
        .eq("id", inspection.id);

      if (inspectionError) {
        throw inspectionError;
      }

      setInspection({
        ...inspection,
        status: "completed",
        completed_at: completedAt,
      });

      setSuccess("Inspection completed successfully.");
    } catch (err: any) {
      console.error("Error completing inspection:", err);
      setError(err?.message || "Unable to complete inspection.");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

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

  function resultButtonClasses(
    currentResult: string | null,
    buttonResult: string
  ) {
    const selected = currentResult === buttonResult;

    if (selected && buttonResult === "pass") {
      return "border-green-600 bg-green-600 text-white";
    }

    if (selected && buttonResult === "needs_attention") {
      return "border-amber-500 bg-amber-500 text-white";
    }

    if (selected && buttonResult === "failed") {
      return "border-red-600 bg-red-600 text-white";
    }

    if (selected && buttonResult === "not_applicable") {
      return "border-gray-500 bg-gray-500 text-white";
    }

    return "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
  }

  function getItemPhotos(itemId: string) {
    return photos.filter((photo) => photo.inspection_item_id === itemId);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-gray-500">Loading inspection...</p>
        </div>
      </AppLayout>
    );
  }

  if (error && !inspection) {
    return (
      <AppLayout>
        <div className="p-8">
          <button
            type="button"
            onClick={() => router.push("/inspections")}
            className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Inspections
          </button>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!inspection) {
    return (
      <AppLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Inspection Not Found
          </h1>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <button
          type="button"
          onClick={() => router.push("/inspections")}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Inspections
        </button>

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {inspection.property?.name || "Property Inspection"}
            </h1>

            <p className="mt-2 text-gray-600">
              Inspection scheduled for{" "}
              {formatDate(inspection.scheduled_date)}
            </p>

            {inspection.property && (
              <p className="mt-1 text-sm text-gray-500">
                {[
                  inspection.property.address,
                  inspection.property.city,
                  inspection.property.state,
                  inspection.property.zip_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
            {inspection.status === "in_progress"
              ? "In Progress"
              : inspection.status === "completed"
                ? "Completed"
                : "Scheduled"}
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Inspection Checklist
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a result for each inspection item and attach photos when
              needed.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {items.map((item, index) => {
              const itemPhotos = getItemPhotos(item.id);

              return (
                <div key={item.id} className="p-6">
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {item.name}
                      </h3>

                      {item.category && (
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                          {item.category}
                        </p>
                      )}

                      {item.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-0 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => updateItemResult(item.id, "pass")}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${resultButtonClasses(
                        item.result,
                        "pass"
                      )}`}
                    >
                      Pass
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateItemResult(item.id, "needs_attention")
                      }
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${resultButtonClasses(
                        item.result,
                        "needs_attention"
                      )}`}
                    >
                      Needs Attention
                    </button>

                    <button
                      type="button"
                      onClick={() => updateItemResult(item.id, "failed")}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${resultButtonClasses(
                        item.result,
                        "failed"
                      )}`}
                    >
                      Failed
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateItemResult(item.id, "not_applicable")
                      }
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${resultButtonClasses(
                        item.result,
                        "not_applicable"
                      )}`}
                    >
                      Not Applicable
                    </button>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`notes-${item.id}`}
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Notes
                    </label>

                    <textarea
                      id={`notes-${item.id}`}
                      value={item.notes || ""}
                      onChange={(event) =>
                        updateItemNotes(item.id, event.target.value)
                      }
                      rows={3}
                      placeholder="Add notes for this inspection item..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          Photos
                        </h4>

                        <p className="mt-1 text-xs text-gray-500">
                          Add photos documenting this inspection item.
                        </p>
                      </div>

                      <label
                        className={`cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 ${
                          uploadingItemId === item.id
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      >
                        {uploadingItemId === item.id
                          ? "Uploading..."
                          : "+ Add Photo"}

                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          disabled={uploadingItemId === item.id}
                          onChange={(event) =>
                            handlePhotoUpload(event, item.id)
                          }
                          className="hidden"
                        />
                      </label>
                    </div>

                    {itemPhotos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {itemPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                          >
                            {photo.signedUrl ? (
                              <img
                                src={photo.signedUrl}
                                alt={`Inspection photo for ${item.name}`}
                                className="h-48 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                                Photo unavailable
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-3 p-3">
                              <p className="truncate text-xs text-gray-500">
                                Inspection photo
                              </p>

                              <button
                                type="button"
                                onClick={() => deletePhoto(photo)}
                                disabled={deletingPhotoId === photo.id}
                                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                {deletingPhotoId === photo.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
                        <p className="text-sm text-gray-500">
                          No photos added yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {item.result && (
                    <p className="mt-3 text-xs text-gray-500">
                      Result: {formatResult(item.result)}
                    </p>
                  )}

                  {(item.result === "failed" ||
                    item.result === "needs_attention") && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      {getWorkOrderForItem(item.id) ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              Work Order Created
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Priority:{" "}
                              {getWorkOrderForItem(item.id)?.work_order
                                ?.priority || "Open"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const workOrderId =
                                getWorkOrderForItem(item.id)?.work_order_id;

                              if (workOrderId) {
                                router.push(
                                  `/work-orders/${workOrderId}`
                                );
                              }
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            View Work Order
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              Work Order Recommended
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.result === "failed"
                                ? "This failed item will create an Urgent work order."
                                : "This item will create a High priority work order."}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => createWorkOrder(item)}
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {saving
                              ? "Creating..."
                              : "Create Work Order"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Inspection Summary
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-700">Pass</p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {items.filter((item) => item.result === "pass").length}
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                Needs Attention
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-800">
                {
                  items.filter(
                    (item) => item.result === "needs_attention"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-700">Failed</p>

              <p className="mt-1 text-2xl font-bold text-red-800">
                {items.filter((item) => item.result === "failed").length}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Remaining</p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {items.filter((item) => !item.result).length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={saveInspection}
            disabled={saving || inspection.status === "completed"}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Inspection"}
          </button>

          <button
            type="button"
            onClick={completeInspection}
            disabled={saving || inspection.status === "completed"}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inspection.status === "completed"
              ? "Inspection Completed"
              : "Complete Inspection"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}