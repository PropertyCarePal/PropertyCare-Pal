"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

type TeamMember = {
  id: string;
  full_name: string | null;
  role: string | null;
};
type WorkOrder = {
    id: string;
    assigned_user_id: string | null;
    status: string | null;
    due_date: string | null;
  };

export default function TeamMembersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!user) return;

      setLoadingMembers(true);
      setError("");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE LOAD ERROR:", profileError);
        setError("Unable to load your profile.");
        setLoadingMembers(false);
        return;
      }

      const { data, error: teamError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("organization_id", profile.organization_id)
        .order("full_name", { ascending: true });
        const { data: workOrderData, error: workOrderError } = await supabase
  .from("work_orders")
  .select("id, assigned_user_id, status, due_date")
  .eq("organization_id", profile.organization_id);

if (workOrderError) {
  console.error("WORK ORDERS LOAD ERROR:", workOrderError);
} else {
  setWorkOrders(workOrderData ?? []);
}
       

      if (teamError) {
        console.error("TEAM MEMBERS LOAD ERROR:", teamError);
        setError("Unable to load team members.");
      } else {
        setTeamMembers(data ?? []);
      }

      setLoadingMembers(false);
    };

    loadTeamMembers();
  }, [user]);

  if (loading || loadingMembers) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading team members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Team Members
        </h1>

        <p className="mt-4 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Team Members
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your PropertyCare Pal team and view their current roles.
        </p>
      </div>

      {teamMembers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-500">
            No team members found.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => {
            const memberWorkOrders = workOrders.filter(
                (workOrder) => workOrder.assigned_user_id === member.id
              );
              console.log(
                "TEAM MEMBER WORKLOAD:",
                member.full_name,
                memberWorkOrders
              );
              
              const activeCount = memberWorkOrders.filter(
                (workOrder) => workOrder.status !== "Completed"
              ).length;
              
              const completedCount = memberWorkOrders.filter(
                (workOrder) => workOrder.status === "Completed"
              ).length;
              
              const overdueCount = memberWorkOrders.filter((workOrder) => {
                if (!workOrder.due_date) return false;
                if (workOrder.status === "Completed") return false;
              
                const dueDate = new Date(workOrder.due_date);
                const today = new Date();
              
                dueDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
              
                return dueDate < today;
              }).length;
              
              return (
            <div
              key={member.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
             <button
  type="button"
  onClick={() => {
    router.push(`/team-members/${member.id}`);
  }}
  className="text-left text-lg font-semibold text-gray-900 hover:text-emerald-600"
>
  {member.full_name || "Team Member"}
</button>

              <p className="mt-2 text-sm text-emerald-600">
                {member.role || "Team Member"}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
              <button
  type="button"
  onClick={() => {
    router.push(
        `/work-orders?assignedUser=${encodeURIComponent(member.id)}&status=active`
      );
  }}
  className="rounded-lg bg-gray-50 p-3 text-center transition hover:bg-gray-100"
>
  <p className="text-xs font-medium text-gray-500">
    Active
  </p>

  <p className="mt-1 text-2xl font-bold text-gray-900">
    {activeCount}
  </p>
</button>
<button
  type="button"
  onClick={() => {
    router.push(
      `/work-orders?assignedUser=${encodeURIComponent(member.id)}&overdue=true`
    );
  }}
  className="rounded-lg bg-red-50 p-3 text-center transition hover:bg-red-100"
>
  <p className="text-xs font-medium text-red-600">
    Overdue
  </p>

  <p className="mt-1 text-2xl font-bold text-red-700">
    {overdueCount}
  </p>
</button>

<button
  type="button"
  onClick={() => {
    router.push(
      `/work-orders?assignedUser=${encodeURIComponent(member.id)}&status=Completed`
    );
  }}
  className="rounded-lg bg-emerald-50 p-3 text-center transition hover:bg-emerald-100"
>
  <p className="text-xs font-medium text-emerald-600">
    Completed
  </p>

  <p className="mt-1 text-2xl font-bold text-emerald-700">
    {completedCount}
  </p>
</button>
</div>
<button
  type="button"
  onClick={() => {
    router.push(
      `/work-orders?assignedUser=${encodeURIComponent(member.id)}`
    );
  }}
  className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
>
  View All Work Orders
</button>
            </div>
                        );
                    })}
        </div>
      )}
    </div>
  );
}