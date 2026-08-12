"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type WorkOrder = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  due_date: string | null;
  status: string | null;
  assigned_to: string | null;
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
  const { user, loading } = useAuth();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("Open");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editEstimatedCost, setEditEstimatedCost] = useState("");
  const [editActualCost, setEditActualCost] = useState("");
  const [editCompletionNotes, setEditCompletionNotes] = useState("");
  async function saveWorkOrderChanges() {
    if (!user || !params.id) return;
  
    const { data, error } = await supabase
      .from("work_orders")
      .update({
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        due_date: editDueDate || null,
        status: editStatus,
        assigned_to: editAssignedTo,
        estimated_cost: editEstimatedCost
          ? Number(editEstimatedCost)
          : null,
        actual_cost: editActualCost
          ? Number(editActualCost)
          : null,
        completion_notes: editCompletionNotes,
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

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", data.property_id)
      .eq("organization_id", profile.organization_id)
      .single();

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
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
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

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row">
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
                className="border-l-2 border-emerald-500 pl-4"
              >
                <p className="font-medium text-gray-900">
                  {activity.description}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
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
                  ? new Date(workOrder.due_date).toLocaleDateString()
                  : "Not set"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Assigned To
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.assigned_to || "Not assigned"}
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
  );
}