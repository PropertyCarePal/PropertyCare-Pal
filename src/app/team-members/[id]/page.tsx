"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type TeamMember = {
  id: string;
  full_name: string | null;
  role: string | null;
};
type WorkOrder = {
    id: string;
    assigned_user_id: string | null;
    status: string;
    due_date: string | null;
  };

export default function TeamMemberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [member, setMember] = useState<TeamMember | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false); 
  const activeCount = workOrders.filter(
    (workOrder) =>
      workOrder.status === "Open" ||
      workOrder.status === "In Progress"
  ).length;
  
  const completedCount = workOrders.filter(
    (workOrder) => workOrder.status === "Completed"
  ).length;
  
  const overdueCount = workOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;
    if (workOrder.status === "Completed") return false;
  
    const dueDate = new Date(workOrder.due_date);
    const today = new Date();
  
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
  
    return dueDate < today;
  }).length;
  async function handleSaveChanges() {
    if (!id) return;
  
    setSaving(true);
    setError("");
  
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: editFullName.trim(),
        role: editRole.trim() || null,
      })
      .eq("id", id)
      .select("id, full_name, role")
      .single();
  
    if (error) {
      console.error("TEAM MEMBER UPDATE ERROR:", error);
      setError("Unable to save team member changes.");
      setSaving(false);
      return;
    }
  
    setMember(data);
    setEditing(false);
    setSaving(false);
  }
  useEffect(() => {
    async function loadTeamMember() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", id)
        .single();
        const { data: workOrderData, error: workOrderError } = await supabase
  .from("work_orders")
  .select("id, assigned_user_id, status, due_date")
  .eq("assigned_user_id", id);

if (workOrderError) {
  console.error("TEAM MEMBER WORK ORDERS LOAD ERROR:", workOrderError);
} else {
  setWorkOrders(workOrderData ?? []);
}

      if (error) {
        console.error("TEAM MEMBER LOAD ERROR:", error);
        setError("Unable to load team member.");
      } else {
        setMember(data);
      }

      setLoading(false);
    }

    loadTeamMember();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
     
        <p className="text-gray-500">Loading team member...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="p-8">
        <p className="text-red-600">
          {error || "Team member not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <button
        type="button"
        onClick={() => router.push("/team-members")}
        className="mb-6 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        ← Back to Team Members
      </button>
  
      <h1 className="text-3xl font-bold text-gray-900">
        {member.full_name || "Team Member"}
      </h1>
  
      <p className="mt-2 text-gray-600">
        {member.role || "No role assigned"}
      </p>
      <button
  type="button"
  onClick={() => {
    setEditFullName(member.full_name || "");
    setEditRole(member.role || "");
    setEditing(true);
  }}
  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
>
  Edit Team Member
</button>
{editing && (
  <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-gray-900">
      Edit Team Member
    </h2>

    <div className="mt-4">
      <label
        htmlFor="editFullName"
        className="block text-sm font-medium text-gray-700"
      >
        Full Name
      </label>

      <input
        id="editFullName"
        type="text"
        value={editFullName}
        onChange={(e) => setEditFullName(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
    </div>

    <div className="mt-4">
      <label
        htmlFor="editRole"
        className="block text-sm font-medium text-gray-700"
      >
        Role
      </label>

      <input
        id="editRole"
        type="text"
        value={editRole}
        onChange={(e) => setEditRole(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
    </div>

    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSaveChanges}
        disabled={saving}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </div>
)}
  
      <div className="mt-8 grid gap-4 md:grid-cols-3">
      <button
  type="button"
  onClick={() => {
    router.push(
      `/work-orders?assignedUser=${encodeURIComponent(id)}&status=active`
    );
  }}
  className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:bg-gray-50"
>
  <p className="text-sm font-medium text-gray-500">
    Active
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {activeCount}
  </p>

  <p className="mt-1 text-sm text-gray-500">
    Open or In Progress
  </p>
</button>
  
<button
  type="button"
  onClick={() => {
    router.push(
      `/work-orders?assignedUser=${encodeURIComponent(id)}&overdue=true`
    );
  }}
  className="rounded-xl border border-red-100 bg-red-50 p-6 text-left shadow-sm transition hover:bg-red-100"
>
  <p className="text-sm font-medium text-red-600">
    Overdue
  </p>

  <p className="mt-2 text-3xl font-bold text-red-700">
    {overdueCount}
  </p>

  <p className="mt-1 text-sm text-red-600">
    Requires attention
  </p>
</button>
  
<button
  type="button"
  onClick={() => {
    router.push(
      `/work-orders?assignedUser=${encodeURIComponent(id)}&status=Completed`
    );
  }}
  className="rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-left shadow-sm transition hover:bg-emerald-100"
>
  <p className="text-sm font-medium text-emerald-600">
    Completed
  </p>

  <p className="mt-2 text-3xl font-bold text-emerald-700">
    {completedCount}
  </p>

  <p className="mt-1 text-sm text-emerald-600">
    Completed work orders
  </p>
</button>
      </div>
      <button
  type="button"
  onClick={() => {
    router.push(
      `/work-orders?assignedUser=${encodeURIComponent(id)}`
    );
  }}
  className="mt-6 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
>
  View All Work Orders
</button>
    </div>
  );
}