"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

type WorkOrder = {
    organization_id: string;
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  due_date: string | null;
  status: string | null;
  assigned_to: string | null;
  assigned_user_id: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
};

type Property = {
  id: string;
  name: string;
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [vendor, setVendor] = useState<{
    id: string;
    company_name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
  } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("Open");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editAssignedUserId, setEditAssignedUserId] = useState("");
  const [teamMembers, setTeamMembers] = useState<
  {
    id: string;
    full_name: string | null;
    role: string | null;
  }[]
>([]);
  const [editEstimatedCost, setEditEstimatedCost] = useState("");
  const [editActualCost, setEditActualCost] = useState("");
  const [editCompletionNotes, setEditCompletionNotes] = useState("");
  const [editVendorCompany, setEditVendorCompany] = useState("");
const [editVendorContact, setEditVendorContact] = useState("");
const [editVendorPhone, setEditVendorPhone] = useState("");
const [editVendorEmail, setEditVendorEmail] = useState("");
const [editVendorNotes, setEditVendorNotes] = useState("");
  async function saveWorkOrderChanges() {
    if (!user || !params.id) return;
    const previousStatus = workOrder?.status;
  
    const { data, error } = await supabase
      .from("work_orders")
      .update({
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        due_date: editDueDate || null,
        status: editStatus,
        assigned_to: editAssignedTo,
        assigned_user_id: editAssignedUserId || null,
        estimated_cost: editEstimatedCost
          ? Number(editEstimatedCost)
          : null,
        actual_cost: editActualCost
          ? Number(editActualCost)
          : null,
        completion_notes: editCompletionNotes,
        completed_at:
        editStatus === "Completed"
          ? workOrder?.completed_at || new Date().toISOString()
          : null,
      })
      .eq("id", String(params.id))
      .select()
      .single();
  
    if (error) {
      console.error("WORK ORDER UPDATE ERROR:", error);
      alert(`Unable to save work order.\n\n${error.message}`);
      return;
    }
  
    setWorkOrder(data);
    const hasVendorInformation =
    editVendorCompany.trim() ||
    editVendorContact.trim() ||
    editVendorPhone.trim() ||
    editVendorEmail.trim() ||
    editVendorNotes.trim();
  
  if (hasVendorInformation) {
    const { data: existingVendor, error: existingVendorError } =
      await supabase
        .from("work_order_vendors")
        .select("id")
        .eq("work_order_id", String(params.id))
        .eq("organization_id", workOrder?.organization_id)
        .maybeSingle();
  
    if (existingVendorError) {
      console.error("EXISTING VENDOR LOOKUP ERROR:", existingVendorError);
      alert(
        `Work order saved, but vendor information could not be loaded.\n\n${existingVendorError.message}`
      );
      return;
    }
  
    const vendorValues = {
      company_name: editVendorCompany.trim() || "Vendor",
      contact_name: editVendorContact.trim() || null,
      phone: editVendorPhone.trim() || null,
      email: editVendorEmail.trim() || null,
      notes: editVendorNotes.trim() || null,
    };
  
    if (existingVendor) {
      const { data: updatedVendor, error: vendorUpdateError } =
        await supabase
          .from("work_order_vendors")
          .update(vendorValues)
          .eq("id", existingVendor.id)
          .eq("work_order_id", String(params.id))
          .eq("organization_id", workOrder?.organization_id)
          .select()
          .single();
  
      if (vendorUpdateError) {
        console.error("VENDOR UPDATE ERROR:", vendorUpdateError);
        alert(
          `Work order saved, but vendor information could not be updated.\n\n${vendorUpdateError.message}`
        );
        return;
      }
  
      setVendor(updatedVendor);
  
      const { error: activityError } = await supabase
        .from("work_order_activity")
        .insert({
          work_order_id: String(params.id),
          organization_id: workOrder?.organization_id, 
          user_id: user.id,
          activity_type: "vendor_updated",
          description: `Vendor information updated: ${vendorValues.company_name}`,
        });
  
      if (activityError) {
        console.error("VENDOR ACTIVITY ERROR:", activityError);
      }
    } else {
      const { data: newVendor, error: vendorInsertError } =
        await supabase
          .from("work_order_vendors")
          .insert({
            work_order_id: String(params.id),
            organization_id: workOrder?.organization_id,
            ...vendorValues,
          })
          .select()
          .single();
  
      if (vendorInsertError) {
        console.error("VENDOR INSERT ERROR:", vendorInsertError);
        alert(
          `Work order saved, but vendor information could not be added.\n\n${vendorInsertError.message}`
        );
        return;
      }
  
      setVendor(newVendor);
  
      const { error: activityError } = await supabase
        .from("work_order_activity")
        .insert({
          work_order_id: String(params.id),
          organization_id: workOrder?.organization_id,
          user_id: user.id,
          activity_type: "vendor_added",
          description: `Vendor added: ${vendorValues.company_name}`,
        });
  
      if (activityError) {
        console.error("VENDOR ACTIVITY ERROR:", activityError);
      }
    }
  } else {
    const { data: existingVendor, error: existingVendorError } =
      await supabase
        .from("work_order_vendors")
        .select("id, company_name")
        .eq("work_order_id", String(params.id))
        .eq("organization_id", workOrder?.organization_id)
        .maybeSingle();
  
    if (existingVendorError) {
      console.error("EXISTING VENDOR LOOKUP ERROR:", existingVendorError);
      alert(
        `Work order saved, but vendor information could not be checked.\n\n${existingVendorError.message}`
      );
      return;
    }
  
    const { error: vendorDeleteError } = await supabase
      .from("work_order_vendors")
      .delete()
      .eq("work_order_id", String(params.id))
      .eq("organization_id", workOrder?.organization_id);
  
    if (vendorDeleteError) {
      console.error("VENDOR DELETE ERROR:", vendorDeleteError);
      alert(
        `Work order saved, but vendor information could not be removed.\n\n${vendorDeleteError.message}`
      );
      return;
    }
  
    setVendor(null);
  
    if (existingVendor) {
      const { error: activityError } = await supabase
        .from("work_order_activity")
        .insert({
          work_order_id: String(params.id),
          organization_id: workOrder?.organization_id,
          user_id: user.id,
          activity_type: "vendor_removed",
          description: `Vendor removed: ${existingVendor.company_name}`,
        });
  
      if (activityError) {
        console.error("VENDOR ACTIVITY ERROR:", activityError);
      }
    }
  }
    const { data: activityData, error: activityError } = await supabase
  .from("work_order_activity")
  .select("*")
  .eq("work_order_id", String(params.id))
  .order("created_at", { ascending: false });

  if (activityError) {
    console.error("ACTIVITY LOAD ERROR:", activityError);
  } else {
    console.log("ACTIVITIES LOADED:", activityData);
    setActivities(activityData || []);
  }
    setEditing(false);
  
    alert("Work order updated successfully.");
  }
  async function uploadAttachment(file: File) {
    if (!user || !params.id || !workOrder) return;
  
    try {
      console.log("ATTACHMENT UPLOAD STARTED:", file.name);
  
      const filePath = `${workOrder.organization_id}/${params.id}/${crypto.randomUUID()}-${file.name}`;
  
      const { error: uploadError } = await supabase.storage
        .from("work-order-attachments")
        .upload(filePath, file);
  
      if (uploadError) {
        console.error("ATTACHMENT UPLOAD ERROR:", uploadError);
        alert(`Unable to upload attachment.\n\n${uploadError.message}`);
        return;
      }
  
      const { data: attachmentData, error: attachmentError } =
        await supabase
          .from("work_order_attachments")
          .insert({
            work_order_id: String(params.id),
            organization_id: workOrder.organization_id,
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || null,
            file_size: file.size,
          })
          .select()
          .single();
  
      if (attachmentError) {
        console.error(
          "ATTACHMENT RECORD ERROR:",
          attachmentError
        );
  
        await supabase.storage
          .from("work-order-attachments")
          .remove([filePath]);
  
        alert(
          `The file uploaded, but its database record could not be created.\n\n${attachmentError.message}`
        );
  
        return;
      }
  
      console.log(
        "ATTACHMENT UPLOADED:",
        attachmentData
      );
  
      setAttachments((current) => [
        attachmentData,
        ...current,
      ]);
      const { error: activityError } = await supabase
  .from("work_order_activity")
  .insert({
    work_order_id: String(params.id),
    organization_id: workOrder.organization_id,
    user_id: user.id,
    activity_type: "attachment_uploaded",
    description: `Attachment uploaded: ${file.name}`,
  });

if (activityError) {
  console.error(
    "ATTACHMENT ACTIVITY ERROR:",
    activityError
  );
}
  
      alert("Attachment uploaded successfully.");
    } catch (error) {
      console.error("ATTACHMENT UNEXPECTED ERROR:", error);
  
      alert(
        `Unable to upload attachment.\n\n${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    }
  }
  async function viewAttachment(attachment: any) {
    try {
      console.log("OPENING ATTACHMENT:", attachment.file_name);
  
      const { data, error } = await supabase.storage
        .from("work-order-attachments")
        .createSignedUrl(attachment.file_path, 60);
  
      if (error) {
        console.error("ATTACHMENT VIEW ERROR:", error);
        alert(
          `Unable to open attachment.\n\n${error.message}`
        );
        return;
      }
  
      if (!data?.signedUrl) {
        alert("Unable to create a secure attachment link.");
        return;
      }
  
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("ATTACHMENT VIEW UNEXPECTED ERROR:", error);
  
      alert(
        `Unable to open attachment.\n\n${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    }
  }
  async function deleteAttachment(attachment: any) {
    if (!user || !params.id) return;
  
    const confirmed = window.confirm(
      `Are you sure you want to delete "${attachment.file_name}"?\n\nThis action cannot be undone.`
    );
  
    if (!confirmed) {
      return;
    }
  
    try {
      console.log(
        "ATTACHMENT DELETE STARTED:",
        attachment.file_name
      );
  
      const { error: storageError } = await supabase.storage
        .from("work-order-attachments")
        .remove([attachment.file_path]);
  
      if (storageError) {
        console.error(
          "ATTACHMENT STORAGE DELETE ERROR:",
          storageError
        );
  
        alert(
          `Unable to delete attachment.\n\n${storageError.message}`
        );
  
        return;
      }
  
      const { error: databaseError } = await supabase
        .from("work_order_attachments")
        .delete()
        .eq("id", attachment.id)
        .eq("work_order_id", String(params.id));
  
      if (databaseError) {
        console.error(
          "ATTACHMENT DATABASE DELETE ERROR:",
          databaseError
        );
  
        alert(
          `The file was removed from storage, but the database record could not be deleted.\n\n${databaseError.message}`
        );
  
        return;
      }
  
      console.log(
        "ATTACHMENT DELETED:",
        attachment.file_name
      );
  
      setAttachments((current) =>
        current.filter(
          (item) => item.id !== attachment.id
        )
      );
  
      alert("Attachment deleted successfully.");
      const { error: activityError } = await supabase
  .from("work_order_activity")
  .insert({
    work_order_id: String(params.id),
    organization_id: workOrder?.organization_id,
    user_id: user.id,
    activity_type: "attachment_deleted",
    description: `Attachment deleted: ${attachment.file_name}`,
  });

if (activityError) {
  console.error(
    "ATTACHMENT DELETE ACTIVITY ERROR:",
    activityError
  );
}
    } catch (error) {
      console.error(
        "ATTACHMENT DELETE UNEXPECTED ERROR:",
        error
      );
  
      alert(
        `Unable to delete attachment.\n\n${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    }
  }
  async function deleteWorkOrder() {
    if (!user || !params.id) return;
  
    const confirmed = window.confirm(
      "Are you sure you want to delete this work order?\n\nThis action cannot be undone."
    );
  
    if (!confirmed) {
      return;
    }
  
    const { data, error } = await supabase
    .from("work_orders")
    .delete()
    .eq("id", String(params.id))
    .select();
  
  if (error) {
    console.error("WORK ORDER DELETE ERROR:", error);
    alert(`Unable to delete work order.\n\n${error.message}`);
    return;
  }
  
  if (!data || data.length === 0) {
    console.error("WORK ORDER DELETE: NO ROW DELETED");
    alert(
      "The work order was not deleted. No matching work order was found."
    );
    return;
  }
  
    alert("Work order deleted successfully.");
  
    window.location.replace("/work-orders");
  }
  useEffect(() => {
    if (!loading && user && params.id) {
      loadWorkOrder();
    }
  }, [loading, user, params.id]);

  async function loadWorkOrder() {
    console.log("LOAD WORK ORDER FUNCTION STARTED");
    if (!user || !params.id) return;

    setPageLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("PROFILE ERROR:", profileError);
      setPageLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("work_orders")
      .select("*")
      .eq("id", String(params.id))
      .eq("organization_id", profile.organization_id)
      .single();

    if (error) {
      console.error("WORK ORDER LOAD ERROR:", error);
      setPageLoading(false);
      return;
    }
    console.log("WORK ORDER LOADED - REACHED ACTIVITY QUERY");
    setWorkOrder(data);
    setEditAssignedUserId(data.assigned_user_id ?? "");
    const { data: teamData, error: teamError } = await supabase
  .from("profiles")
  .select("id, full_name, role")
  .eq("organization_id", profile.organization_id)
  .order("full_name", { ascending: true });

if (teamError) {
  console.error("TEAM MEMBERS LOAD ERROR:", teamError);
} else {
  setTeamMembers(teamData ?? []);
}
    const { data: activityData, error: activityError } = await supabase
  .from("work_order_activity")
  .select("*")
  .eq("work_order_id", String(params.id))
  .order("created_at", { ascending: false });

if (activityError) {
  console.error("ACTIVITY LOAD ERROR:", activityError);
} else {
  console.log("ACTIVITIES LOADED:", activityData);
  setActivities(activityData || []);
}
const { data: attachmentData, error: attachmentError } = await supabase
  .from("work_order_attachments")
  .select("*")
  .eq("work_order_id", String(params.id))
  .order("created_at", { ascending: false });

if (attachmentError) {
  console.error("ATTACHMENT LOAD ERROR:", attachmentError);
} else {
  console.log("ATTACHMENTS LOADED:", attachmentData);
  setAttachments(attachmentData || []);
}

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", data.property_id)
      .eq("organization_id", profile.organization_id)
      .single();
      const { data: vendorData, error: vendorError } = await supabase
  .from("work_order_vendors")
  .select(`
    id,
    company_name,
    contact_name,
    phone,
    email,
    notes
  `)
  .eq("work_order_id", String(params.id))
  .eq("organization_id", profile.organization_id)
  .maybeSingle();

if (vendorError) {
  console.error("VENDOR LOAD ERROR:", vendorError);
} else {
  console.log("VENDOR LOADED:", vendorData);
  setVendor(vendorData);
}

    if (propertyError) {
      console.error("PROPERTY LOAD ERROR:", propertyError);
    } else {
      setProperty(propertyData);
    }

    setPageLoading(false);
  }

  if (loading || pageLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading work order...</p>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Work Order Not Found
        </h1>

        <Link
          href="/work-orders"
          className="mt-4 inline-block text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Work Orders
        </Link>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
    {editing && (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-900">
        Edit Work Order
      </h2>

      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        >
          <option value="Open">Open</option>
<option value="Scheduled">Scheduled</option>
<option value="In Progress">In Progress</option>
<option value="Completed">Completed</option>
<option value="Closed">Closed</option>
<option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          value={editPriority}
          onChange={(e) => setEditPriority(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <input
          type="date"
          value={editDueDate}
          onChange={(e) => setEditDueDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Assigned To
        </label>
        <input
          value={editAssignedTo}
          onChange={(e) => setEditAssignedTo(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>
      <div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Assigned Team Member
  </label>
 
 
  <select
  value={editAssignedUserId || workOrder?.assigned_user_id || ""}
  onChange={(e) => setEditAssignedUserId(e.target.value)}
  className="mt-1 w-full rounded-lg border border-gray-300 p-3"
>
    <option value="">Unassigned</option>

    {teamMembers.map((member) => (
      <option key={member.id} value={member.id}>
        {member.full_name || "Unnamed User"}
        {member.role ? ` — ${member.role}` : ""}
      </option>
    ))}
  </select>
  {(editAssignedUserId || workOrder?.assigned_user_id) && (
  <button
    type="button"
    onClick={() => {
      const assignedMemberId =
        editAssignedUserId || workOrder?.assigned_user_id;

      if (assignedMemberId) {
        router.push(`/team-members/${assignedMemberId}`);
      }
    }}
    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
  >
    View Team Member →
  </button>
)}
</div>
<div className="md:col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Vendor Information
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Add the outside vendor or service provider handling this work order.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vendor Company
            </label>
            <input
              value={editVendorCompany}
              onChange={(e) => setEditVendorCompany(e.target.value)}
              placeholder="Company name"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Name
            </label>
            <input
              value={editVendorContact}
              onChange={(e) => setEditVendorContact(e.target.value)}
              placeholder="Vendor contact person"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={editVendorPhone}
              onChange={(e) => setEditVendorPhone(e.target.value)}
              placeholder="Vendor phone number"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={editVendorEmail}
              onChange={(e) => setEditVendorEmail(e.target.value)}
              placeholder="Vendor email address"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Vendor Notes
            </label>
            <textarea
              value={editVendorNotes}
              onChange={(e) => setEditVendorNotes(e.target.value)}
              placeholder="Additional vendor information or instructions"
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Estimated Cost
        </label>
        <input
          type="number"
          step="0.01"
          value={editEstimatedCost}
          onChange={(e) => setEditEstimatedCost(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Actual Cost
        </label>
        <input
          type="number"
          step="0.01"
          value={editActualCost}
          onChange={(e) => setEditActualCost(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Completion Notes
        </label>
        <textarea
          value={editCompletionNotes}
          onChange={(e) => setEditCompletionNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded-lg border border-gray-300 px-5 py-3 text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
  type="button"
  onClick={saveWorkOrderChanges}
  className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700"
>
  Save Changes
</button> 
    </div>
  </div>
)}
      <div>
        <Link
          href="/work-orders"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Work Orders
        </Link>

        <div className="relative mt-4 flex flex-col justify-between gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 md:flex-row">
        {workOrder.status === "Completed" && (
  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
    <div className="-rotate-12 rounded-lg border-4 border-gray-400 px-8 py-3 text-5xl font-black tracking-widest text-gray-400 opacity-25">
      CLOSED
    </div>
  </div>
)}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {workOrder.title}
            </h1>

            {property && (
              <Link
                href={`/properties/${property.id}`}
                className="mt-2 inline-block text-emerald-600 hover:text-emerald-700"
              >
                {property.name}
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
  <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
    {workOrder.status || "Open"}
  </span>

  <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
    {workOrder.priority || "Medium"}
  </span>

  <button
  type="button"
  onClick={() => {
    setEditTitle(workOrder.title || "");
    setEditDescription(workOrder.description || "");
    setEditPriority(workOrder.priority || "Medium");
    setEditDueDate(workOrder.due_date || "");
    setEditStatus(workOrder.status || "Open");
    setEditAssignedTo(workOrder.assigned_to || "");
    setEditAssignedUserId(workOrder.assigned_user_id || "");
       setEditEstimatedCost(
      workOrder.estimated_cost !== null &&
      workOrder.estimated_cost !== undefined
        ? String(workOrder.estimated_cost)
        : ""
    );
    setEditActualCost(
      workOrder.actual_cost !== null &&
      workOrder.actual_cost !== undefined
        ? String(workOrder.actual_cost)
        : ""
    );
    setEditCompletionNotes(workOrder.completion_notes || "");
    setEditVendorCompany(vendor?.company_name || "");
setEditVendorContact(vendor?.contact_name || "");
setEditVendorPhone(vendor?.phone || "");
setEditVendorEmail(vendor?.email || "");
setEditVendorNotes(vendor?.notes || "");
    setEditing(true);
  }}
  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
>
  Edit Work Order
</button>
<button
  type="button"
  onClick={deleteWorkOrder}
  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
>
  Delete Work Order
</button>
</div>
        </div>
      </div>
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold text-gray-900">
      Attachments
    </h2>

    <>
    <input
  type="file"
  id="work-order-attachment-input"
  className="hidden"
  onChange={(event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    uploadAttachment(file);

    event.target.value = "";
  }}
/>

  <label
    htmlFor="work-order-attachment-input"
    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
  >
    Upload File
  </label>
</>
  </div>

  {attachments.length === 0 ? (
    <p className="mt-4 text-sm text-gray-500">
      No attachments uploaded yet.
    </p>
  ) : (
    <div className="mt-6 space-y-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
        >
          <div>
          <button
  type="button"
  onClick={() => viewAttachment(attachment)}
  className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
>
  {attachment.file_name}
</button>

            <p className="mt-1 text-xs text-gray-500">
              {attachment.file_type || "Unknown file type"}
            </p>
          </div>
          <button
    type="button"
    onClick={() => deleteAttachment(attachment)}
    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
  >
    Delete
  </button>
</div>
      ))}
    </div>
  )}
</div> 
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Activity History
        </h2>

        {activities.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No activity recorded yet.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {activities.map((activity) => (
            <div
            key={activity.id}
            className={
              activity.description?.toLowerCase().includes("completed") ||
              activity.description?.toLowerCase().includes("closed")
                ? "border-l-4 border-emerald-600 bg-emerald-50 rounded-r-lg py-3 pl-4"
                : "border-l-2 border-emerald-500 pl-4"
            }
          >
             
             {activity.description?.toLowerCase().includes("completed") ||
activity.description?.toLowerCase().includes("closed") ? (
  <>
    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
      ✓ Work Order Closed
    </p>

    <p className="mt-1 font-semibold text-gray-900">
      {activity.description}
    </p>

    <p className="mt-1 text-sm font-medium text-emerald-700">
      Completed on{" "}
      {new Date(activity.created_at).toLocaleDateString()}
    </p>

    <p className="mt-1 text-xs text-gray-500">
      {new Date(activity.created_at).toLocaleTimeString()}
    </p>
  </>
) : (
  <>
    <p className="font-medium text-gray-900">
      {activity.description}
    </p>

    <p className="mt-1 text-xs text-gray-500">
      {new Date(activity.created_at).toLocaleString()}
    </p>
  </>
)}
              </div>
            ))}
          </div>
        )}
      </div>      

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Description
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-gray-600">
            {workOrder.description || "No description provided."}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Work Order Details
          </h2>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Due Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
  {workOrder.due_date
    ? (() => {
        const [year, month, day] = workOrder.due_date.split("-");
        return `${month}/${day}/${year}`;
      })()
    : "Not set"}
</dd> 
            </div>

            <div>
  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
    Assigned To
  </dt>

  <dd className="mt-1 text-sm text-gray-900">
    {workOrder.assigned_user_id
      ? teamMembers.find(
          (member) => member.id === workOrder.assigned_user_id
        )?.full_name || "Assigned user"
      : workOrder.assigned_to || "Not assigned"}
  </dd>
</div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Estimated Cost
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.estimated_cost !== null
                  ? `$${workOrder.estimated_cost.toLocaleString()}`
                  : "Not set"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actual Cost
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.actual_cost !== null
                  ? `$${workOrder.actual_cost.toLocaleString()}`
                  : "Not set"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(workOrder.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
            {/* Vendor Information */}
<div className="rounded-lg border border-gray-200 bg-white p-6">
  <h2 className="text-xl font-semibold text-gray-900">
    Vendor Information
  </h2>

  {vendor ? (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-sm font-medium text-gray-500">
          Vendor Company
        </p>
        <p className="mt-1 text-base text-gray-900">
          {vendor.company_name}
        </p>
      </div>

      {vendor.contact_name && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Contact Name
          </p>
          <p className="mt-1 text-base text-gray-900">
            {vendor.contact_name}
          </p>
        </div>
      )}

      {vendor.phone && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Phone
          </p>
          <a
            href={`tel:${vendor.phone}`}
            className="mt-1 block text-base text-blue-600 hover:text-blue-800"
          >
            {vendor.phone}
          </a>
        </div>
      )}

      {vendor.email && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Email
          </p>
          <a
            href={`mailto:${vendor.email}`}
            className="mt-1 block text-base text-blue-600 hover:text-blue-800"
          >
            {vendor.email}
          </a>
        </div>
      )}

      {vendor.notes && (
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-500">
            Vendor Notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-base text-gray-900">
            {vendor.notes}
          </p>
        </div>
      )}
    </div>
  ) : (
    <p className="mt-4 text-sm text-gray-500">
      No vendor assigned to this work order.
    </p>
  )}
</div>
  
        </div>
        </div>
        
            
 
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Completion Notes
        </h2>

        <p className="mt-3 whitespace-pre-wrap text-gray-600">
          {workOrder.completion_notes || "No completion notes yet."}
        </p>

        {workOrder.completed_at && (
          <p className="mt-4 text-sm text-gray-500">
            Completed on{" "}
            {new Date(workOrder.completed_at).toLocaleDateString()}
          </p>
        )}
      </div>
      </div>
  </AppLayout>
  );
}