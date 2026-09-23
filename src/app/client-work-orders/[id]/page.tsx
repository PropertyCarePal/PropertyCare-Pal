"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import ClientSidebar from "@/components/ClientSidebar";

type WorkOrder = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  completed_at: string | null;
  property_id: string | null;
  description: string | null;
  completion_notes: string | null;
  estimated_cost: number | null;
actual_cost: number | null;
};

type Property = {
  id: string;
  name: string;
};
type WorkOrderVendor = {
    company_name: string | null;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
  };
  type WorkOrderAttachment = {
    id: string;
    work_order_id: string;
    file_name: string | null;
    file_path: string | null;
    file_type: string | null;
    file_size: number | null;
    created_at: string;
    signed_url?: string;
  };

export default function ClientWorkOrderDetailPage() {
  const supabase = getSupabaseClient();
  const params = useParams();
  const router = useRouter();

  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [vendor, setVendor] = useState<WorkOrderVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<WorkOrderAttachment[]>([]);

  useEffect(() => {
    async function loadWorkOrder() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view this work order.");
          setLoading(false);
          return;
        }

        const { data: access, error: accessError } = await supabase
          .from("client_properties")
          .select("property_id")
          .eq("profile_id", user.id);

        if (accessError) throw accessError;

        if (!access || access.length === 0) {
          setError("No property has been assigned to your account.");
          setLoading(false);
          return;
        }

        const propertyIds = access.map((item) => item.property_id);

        const { data: workOrderData, error: workOrderError } =
          await supabase
          .from("work_orders")
          .select(
            "id, title, status, priority, due_date, completed_at, property_id, description, completion_notes, estimated_cost, actual_cost"
          )
            .eq("id", workOrderId)
            .maybeSingle();

        if (workOrderError) throw workOrderError;

        if (!workOrderData) {
          setError("Work order not found.");
          setLoading(false);
          return;
        }

        if (
          !workOrderData.property_id ||
          !propertyIds.includes(workOrderData.property_id)
        ) {
          setError("You do not have access to this work order.");
          setLoading(false);
          return;
        }

        setWorkOrder(workOrderData);
        const { data: vendorData, error: vendorError } = await supabase
        .from("work_order_vendors")
        .select("company_name, contact_name, phone, email, notes")
        .eq("work_order_id", workOrderId)
        .maybeSingle();
      
      if (vendorError) throw vendorError;
      
      setVendor(vendorData);
      const { data: attachmentData, error: attachmentError } = await supabase
      .from("work_order_attachments")
  .select(
    "id, work_order_id, file_name, file_path, file_type, file_size, created_at"
  )
  .eq("work_order_id", workOrderId)
  .order("created_at", { ascending: false });
  console.log("WORK ORDER ID:", workOrderId);
console.log("ATTACHMENT DATA:", attachmentData);
console.log("ATTACHMENT ERROR:", attachmentError);

if (attachmentError) throw attachmentError;

const attachmentsWithUrls = await Promise.all(
    (attachmentData ?? []).map(async (attachment) => {
      if (!attachment.file_path) {
        return attachment;
      }
  
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("work-order-attachments")
          .createSignedUrl(attachment.file_path, 60 * 60);
  
      if (signedUrlError) {
        console.error(
          "ATTACHMENT SIGNED URL ERROR:",
          signedUrlError
        );
  
        return attachment;
      }
  
      return {
        ...attachment,
        signed_url: signedUrlData.signedUrl,
      };
    })
  );
  console.log("ATTACHMENTS FOUND:", attachmentsWithUrls);
  setAttachments(attachmentsWithUrls);
        const { data: propertyData, error: propertyError } =
        
          await supabase
            .from("properties")
            .select("id, name")
            .eq("id", workOrderData.property_id)
            .maybeSingle();

        if (propertyError) throw propertyError;

        setProperty(propertyData);
      } catch (err) {
        console.error("CLIENT WORK ORDER DETAIL ERROR:", err);

        if (err && typeof err === "object") {
          console.error("ERROR DETAILS:", JSON.stringify(err, null, 2));
        }
        
        alert(
          err instanceof Error
            ? err.message
            : JSON.stringify(err, null, 2)
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this work order."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorkOrder();
  }, [workOrderId]);

  function formatDate(date: string | null) {
    if (!date) return "Not available";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function getStatusClasses(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "in progress":
        return "bg-blue-100 text-blue-700";

      case "scheduled":
        return "bg-purple-100 text-purple-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getPriorityClasses(priority: string | null) {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700";

      case "medium":
        return "bg-yellow-100 text-yellow-700";

      case "low":
        return "bg-green-100 text-green-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex flex-1 items-center justify-center">
          <p className="text-gray-600">
            Loading work order...
          </p>
        </main>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <ClientSidebar />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-5xl">
            <button
              onClick={() => router.push("/client-work-orders")}
              className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Back to Work Orders
            </button>

            <div className="rounded-xl bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                Work Order
              </h1>

              <p className="mt-2 text-gray-600">
                {error || "Work order not found."}
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
              Work Order Details
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
              Client Portal
            </p>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-5xl">
            <button
              onClick={() => router.push("/client-work-orders")}
              className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Back to Work Orders
            </button>

            <div className="rounded-xl bg-white shadow-sm">
              <div className="border-b p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                      Maintenance Request
                    </p>

                    <h2 className="mt-1 text-3xl font-bold text-gray-900">
                      {workOrder.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        workOrder.status
                      )}`}
                    >
                      {workOrder.status || "Open"}
                    </span>

                    {workOrder.priority && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                          workOrder.priority
                        )}`}
                      >
                        {workOrder.priority} Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Property
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {property?.name || "Property not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {workOrder.status || "Open"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Priority
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {workOrder.priority || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Scheduled Date
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(workOrder.due_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Completed Date
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(workOrder.completed_at)}
                    </p>
                  </div>
                </div>
                {vendor && (
  <div className="mt-8 border-t pt-6">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
      Service Provider
    </p>

    <div className="mt-3 rounded-lg bg-gray-50 p-4">
      <h3 className="text-lg font-bold text-gray-900">
        {vendor.company_name || "Service Provider"}
      </h3>

      {vendor.contact_name && (
        <p className="mt-2 text-sm text-gray-600">
          Contact: {vendor.contact_name}
        </p>
      )}

      {vendor.phone && (
        <p className="mt-1 text-sm text-gray-600">
          Phone: {vendor.phone}
        </p>
      )}

      {vendor.email && (
        <p className="mt-1 text-sm text-gray-600">
          Email: {vendor.email}
        </p>
      )}

      {vendor.notes && (
        <p className="mt-3 text-sm text-gray-600">
          {vendor.notes}
        </p>
      )}
    </div>
  </div>
)}
                <div className="mt-8 border-t pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-gray-700">
                    {workOrder.description ||
                      "No description has been provided for this work order."}
                  </p>
                </div>
                {workOrder.completion_notes && (
  <div className="mt-8 border-t pt-6">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
      Completed Notes
    </p>

    <div className="mt-3 rounded-lg bg-gray-50 p-4">
      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
      {workOrder.completion_notes}
      </p>
    </div>
  </div>
)} 
<div className="mt-8 border-t pt-6">
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
    Cost
  </p>

  <div className="mt-3 grid gap-4 sm:grid-cols-2">
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500">
        Estimated Cost
      </p>

      <p className="mt-1 text-lg font-bold text-gray-900">
        {workOrder.estimated_cost != null
          ? `$${Number(workOrder.estimated_cost).toFixed(2)}`
          : "Not provided"}
      </p>
    </div>

    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500">
        Actual Cost
      </p>

      <p className="mt-1 text-lg font-bold text-gray-900">
        {workOrder.actual_cost != null
          ? `$${Number(workOrder.actual_cost).toFixed(2)}`
          : "Not provided"}
      </p>
      </div>
</div>

<div className="mt-8 border-t pt-6">
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
    Photos & Attachments
  </p>

  {attachments.length === 0 ? (
    <p className="mt-3 text-sm text-gray-500">
      No photos or attachments have been added to this work order.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
        >
          <div>
          {attachment.signed_url ? (
  <a
    href={attachment.signed_url}
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
  >
    {attachment.file_name || "Attachment"}
  </a>
) : (
  <p className="font-medium text-gray-900">
    {attachment.file_name || "Attachment"}
  </p>
)}

            <p className="mt-1 text-xs text-gray-500">
              {attachment.file_type || "File"}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

              </div>


              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}