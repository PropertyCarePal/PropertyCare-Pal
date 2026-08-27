"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

type WorkOrder = {
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
type TeamMember = {
  id: string;
  full_name: string | null;
  role: string | null;
};
function WorkOrdersContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
const assignedUserFromUrl = searchParams.get("assignedUser");
const overdueFromUrl = searchParams.get("overdue") === "true";
const statusFromUrl = searchParams.get("status");

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]); 
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOverdue, setShowOverdue] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortOption, setSortOption] = useState("due_soonest");
  const [showDueToday, setShowDueToday] = useState(false);
  const [showDueThisWeek, setShowDueThisWeek] = useState(false);
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);
  const [assignedUserFilter, setAssignedUserFilter] = useState("All");
  useEffect(() => {
    async function loadWorkOrders() {
      if (!user) {
        setLoadingWorkOrders(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("PROFILE ERROR:", profileError);
        setLoadingWorkOrders(false);
        return;
      }

      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("id, name")
        .eq("organization_id", profile.organization_id);

      if (propertyError) {
        console.error("PROPERTY LOAD ERROR:", propertyError);
      } else {
        setProperties(propertyData || []);
      }
      const { data: teamMemberData, error: teamMemberError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("organization_id", profile.organization_id);
    
    if (teamMemberError) {
      console.error("TEAM MEMBER LOAD ERROR:", teamMemberError);
    } else {
      setTeamMembers(teamMemberData || []);
    }
      const { data: workOrderData, error: workOrderError } = await supabase
        .from("work_orders")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (workOrderError) {
        console.error("WORK ORDER LOAD ERROR:", workOrderError);
      } else {
        console.log("ALL WORK ORDERS LOADED:", workOrderData);
        console.log(
          "COMPLETED WORK ORDERS:",
          workOrderData?.filter((order) => order.status === "Completed")
        );
        setWorkOrders(workOrderData || []);
      }

      setLoadingWorkOrders(false);
    }

    if (!loading && user) {
        loadWorkOrders();
      }
  }, [user, loading]);

  function getPropertyName(propertyId: string) {
    const property = properties.find(
      (property) => property.id === propertyId
    );

    return property?.name || "Unknown Property";
  }
  const openCount = workOrders.filter(
    (workOrder) => workOrder.status === "Open"
  ).length;
  
  const inProgressCount = workOrders.filter(
    (workOrder) => workOrder.status === "In Progress"
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
  const myWorkCount = workOrders.filter(
    (workOrder) =>
      workOrder.assigned_user_id === user?.id &&
      workOrder.status !== "Completed"
  ).length;
  const myWorkDueTodayCount = workOrders.filter((workOrder) => {
    if (workOrder.assigned_user_id !== user?.id) return false;
    if (workOrder.status === "Completed") return false;
    if (!workOrder.due_date) return false;
  
    const today = new Date();
  
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
  
    const todayString = `${year}-${month}-${day}`;
  
    return workOrder.due_date === todayString;
  }).length;
  const myWorkOverdueCount = workOrders.filter((workOrder) => {
    if (workOrder.assigned_user_id !== user?.id) return false;
    if (workOrder.status === "Completed") return false;
    if (!workOrder.due_date) return false;
  
    const dueDate = new Date(workOrder.due_date);
    const today = new Date();
  
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
  
    return dueDate < today;
  }).length;
  const inProgressAssignedCount = workOrders.filter(
    (workOrder) =>
      workOrder.status === "In Progress" &&
      !!workOrder.assigned_user_id
  ).length;
  const inProgressUnassignedCount =
  inProgressCount - inProgressAssignedCount
  const urgentCount = workOrders.filter(
    (workOrder) => workOrder.priority === "Urgent"
  ).length;
  const urgentOverdueCount = workOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;
    if (workOrder.status === "Completed") return false;
    if (workOrder.priority !== "Urgent") return false;
  
    const dueDate = new Date(workOrder.due_date);
    const today = new Date();
  
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
  
    return dueDate < today;
  }).length; 
  const highCount = workOrders.filter(
    (workOrder) => workOrder.priority === "High"
  ).length;
  
  const mediumCount = workOrders.filter(
    (workOrder) => workOrder.priority === "Medium"
  ).length;
  
  const lowCount = workOrders.filter(
    (workOrder) => workOrder.priority === "Low"
  ).length;
  const dueTodayCount = workOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;
    if (workOrder.status === "Completed") return false;
  
    const today = new Date();
  
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
  
    const todayString = `${year}-${month}-${day}`;
  
    return workOrder.due_date === todayString;
  }).length;
  const urgentDueTodayCount = workOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;
    if (workOrder.status === "Completed") return false;
    if (workOrder.priority !== "Urgent") return false;
  
    const today = new Date();
  
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
  
    const todayString = `${year}-${month}-${day}`;
  
    return workOrder.due_date === todayString;
  }).length;
  const dueThisWeekCount = workOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;
    if (workOrder.status === "Completed") return false;
  
    const today = new Date();
  
    today.setHours(0, 0, 0, 0);
  
    const weekFromToday = new Date(today);
    weekFromToday.setDate(today.getDate() + 7);
  
    const [year, month, day] = workOrder.due_date
      .split("-")
      .map(Number);
  
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
  
    return dueDate >= today && dueDate <= weekFromToday;
  }).length;
  const dueThisWeekAssignedCount = workOrders.filter((workOrder) => {
    if (!workOrder.due_date) return false;
    if (workOrder.status === "Completed") return false;
    if (!workOrder.assigned_user_id) return false;
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const weekFromToday = new Date(today);
    weekFromToday.setDate(today.getDate() + 7);
  
    const [year, month, day] = workOrder.due_date
      .split("-")
      .map(Number);
  
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
  
    return dueDate >= today && dueDate <= weekFromToday;
  }).length;
  
  const dueThisWeekUnassignedCount =
    dueThisWeekCount - dueThisWeekAssignedCount;
  function getTeamMemberName(userId: string | null) {
    if (!userId) {
      return "Unassigned";
    }
  
    const member = teamMembers.find(
      (member) => member.id === userId
    );
  
    if (!member) {
      return "Unassigned";
    }
  
    return `${member.full_name || "Unnamed User"}${
      member.role ? ` — ${member.role}` : ""
    }`;
  } 

  if (loading || loadingWorkOrders) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
        <p className="mt-2 text-gray-600">Loading work orders...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
      <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
          Work Orders
        </h1>

        <p className="mt-2 text-gray-600">
          Manage maintenance work orders across all of your properties.
        </p>
        <div className="mt-6">
  <label
    htmlFor="workOrderSearch"
    className="mr-3 text-sm font-medium text-gray-700"
  >
    Search:
  </label>

  <input
    id="workOrderSearch"
    type="text"
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    placeholder="Search work orders..."
    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
  />
</div>
        <div className="mt-6">
  <label
    htmlFor="statusFilter"
    className="mr-3 text-sm font-medium text-gray-700"
  >
    Filter by Status:
  </label>

  <select
    id="statusFilter"
    value={statusFilter}
    onChange={(event) => setStatusFilter(event.target.value)}
    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
  >
    <option value="All">All</option>
    <option value="Open">Open</option>
    <option value="In Progress">In Progress</option>
    <option value="Completed">Completed</option>
  </select>
  <label
  htmlFor="sortOption"
  className="ml-4 mr-3 text-sm font-medium text-gray-700"
>
  Sort By:
</label>

<select
  id="sortOption"
  value={sortOption}
  onChange={(event) => setSortOption(event.target.value)}
  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
>
  <option value="due_soonest">Due Date — Earliest First</option>
  <option value="due_latest">Due Date — Latest First</option>
  <option value="priority_high">Priority — Urgent First</option>
  <option value="priority_low">Priority — Low First</option>
  <option value="newest">Newest Created</option>
  <option value="oldest">Oldest Created</option>
</select>
  <button
  type="button"
  onClick={() => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setShowOverdue(false);
    setSortOption("due_soonest");
    setShowDueToday(false);
    setShowDueThisWeek(false);
    setShowAssignedToMe(false);
    setAssignedUserFilter("All");
  }}
  className="ml-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
>
  Clear Filters
</button>
</div>
{(statusFilter !== "All" ||
  priorityFilter !== "All" ||
  showOverdue ||
  showDueToday ||
  showDueThisWeek ||
  searchTerm) && (
  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
    <span className="font-semibold">Active filters:</span>{" "}

    {searchTerm && (
      <span className="mr-2">
        Search: "{searchTerm}"
      </span>
    )}

    {statusFilter !== "All" && (
      <span className="mr-2">
        Status: {statusFilter}
      </span>
    )}

    {priorityFilter !== "All" && (
      <span className="mr-2">
        Priority: {priorityFilter}
      </span>
    )}

    {showOverdue && (
            <span className="mr-2">
        Overdue
      </span>
    )}
    {showDueToday && (
  <span className="mr-2">
    Due Today
  </span>
)}
{showDueThisWeek && (
  <span className="mr-2">
    Due This Week
  </span>
)}
  </div>
)}
<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<button
  type="button"
  onClick={() => {
    setShowOverdue(false);
    setPriorityFilter("All");
    setStatusFilter("Open");
    setShowDueToday(false);
setShowDueThisWeek(false);
  }}
  className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
>
  <p className="text-sm font-medium text-gray-500">
    Open
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {openCount}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>

<button
  type="button"
  onClick={() => {
    setShowOverdue(false);
    setPriorityFilter("All");
    setStatusFilter("In Progress");
  }}
  className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5 text-left shadow-md transition hover:border-blue-500 hover:shadow-lg" 
>
  <p className="text-sm font-medium text-gray-500">
    In Progress
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {inProgressCount}
  </p>
  <p className="mt-1 text-xs font-medium text-blue-700">
  {inProgressAssignedCount} Assigned ·{" "}
  {inProgressUnassignedCount} Unassigned
</p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>

<button
  type="button"
  onClick={() => {
    setShowOverdue(false);
    setPriorityFilter("All");
    setStatusFilter("Completed");
  }}
  className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
>
  <p className="text-sm font-medium text-gray-500">
    Completed
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {completedCount}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>

<button
  type="button"
  onClick={() => {
    setShowOverdue(true);
    setPriorityFilter("All");
    setStatusFilter("All");
    setShowDueToday(false);
setShowDueThisWeek(false);
  }}
  className="rounded-xl border-2 border-red-300 bg-red-50 p-5 text-left shadow-md transition hover:border-red-500 hover:shadow-lg"
>
  <p className="text-sm font-medium text-gray-500">
    Overdue
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {overdueCount}
  </p>
  <p className="mt-1 text-xs font-medium text-red-700">
  {urgentOverdueCount > 0
    ? `${urgentOverdueCount} Urgent`
    : "No Urgent Items"}
</p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>
</div>
<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<button
  type="button"
  onClick={() => {
    setPriorityFilter("Urgent");
    setShowOverdue(false);
    setStatusFilter("All");
    setShowDueToday(false);
setShowDueThisWeek(false);
  }}
  className="rounded-xl border-2 border-orange-300 bg-orange-50 p-5 text-left shadow-md transition hover:border-orange-500 hover:shadow-lg"
>
  <p className="text-sm font-medium text-gray-500">
    Urgent
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {urgentCount}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>
<button
  type="button"
  onClick={() => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setShowOverdue(false);
    setShowDueToday(false);
    setShowDueThisWeek(false);
    setShowAssignedToMe(true);
    setAssignedUserFilter("All");
    setSortOption("due_soonest");
  }}
  className="rounded-xl border-2 border-violet-300 bg-violet-50 p-5 text-left shadow-md transition hover:border-violet-500 hover:shadow-lg"
>
  <p className="text-sm font-medium text-violet-700">
    My Work
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {myWorkCount}
  </p>

  <p className="mt-1 text-xs font-medium text-violet-700">
  {myWorkOverdueCount > 0
    ? `${myWorkOverdueCount} Overdue`
    : myWorkDueTodayCount > 0
    ? `${myWorkDueTodayCount} Due Today`
    : "No Work Due Today"}
</p>
</button>

<button
  type="button"
  onClick={() => {
    setPriorityFilter("High");
    setShowOverdue(false);
    setStatusFilter("All");
    setShowDueToday(false);
setShowDueThisWeek(false);
  }}
  className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
>
  <p className="text-sm font-medium text-gray-500">
    High
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {highCount}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>

<button
  type="button"
  onClick={() => {
    setPriorityFilter("Medium");
    setShowOverdue(false);
    setStatusFilter("All");
    setShowDueToday(false);
    setShowDueThisWeek(false); 
  }}
  className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
>
  <p className="text-sm font-medium text-gray-500">
    Medium
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {mediumCount}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>

<button
  type="button"
  onClick={() => {
    setPriorityFilter("Low");
    setShowOverdue(false);
    setStatusFilter("All");
    setShowDueToday(false);
setShowDueThisWeek(false);
  }}
  className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
>
  <p className="text-sm font-medium text-gray-500">
    Low
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {lowCount}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>
</div>
<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <button
    type="button"
    onClick={() => {
      setShowDueToday(true);
      setShowDueThisWeek(false); 
      setShowOverdue(false);
      setPriorityFilter("All");
      setStatusFilter("All");
    }}
    className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 text-left shadow-md transition hover:border-emerald-500 hover:shadow-lg"
  >
    <p className="text-sm font-medium text-gray-500">
      Due Today
    </p>

    <p className="mt-2 text-3xl font-bold text-gray-900">
      {dueTodayCount}
    </p>
    <p className="mt-1 text-xs font-medium text-emerald-700">
  {urgentDueTodayCount > 0
    ? `${urgentDueTodayCount} Urgent`
    : "No Urgent Items"}
</p>

    <p className="mt-1 text-xs text-gray-500">
      Click to view
    </p>
  </button>

  <button
  type="button"
  onClick={() => {
    setShowDueThisWeek(true);
    setShowDueToday(false);
    setShowOverdue(false);
    setPriorityFilter("All");
    setStatusFilter("All");
  }}
  className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5 text-left shadow-sm transition hover:border-indigo-400 hover:shadow-md"
>
  <p className="text-sm font-medium text-gray-500">
    Due This Week
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {dueThisWeekCount}
  </p>
  <p className="mt-1 text-xs font-medium text-indigo-700">
  {dueThisWeekAssignedCount} Assigned ·{" "}
  {dueThisWeekUnassignedCount} Unassigned
</p>

  <p className="mt-1 text-xs text-gray-500">
    Click to view
  </p>
</button>
</div>
      </div>

      {workOrders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            No Work Orders Yet
          </h2>

          <p className="mt-2 text-gray-600">
            Work orders created inside your properties will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
       {workOrders
  .filter(
    (workOrder) => {
      const property = properties.find(
        (item) => item.id === workOrder.property_id
      );

      const search = searchTerm.toLowerCase();

      const dueDate = workOrder.due_date
      ? new Date(workOrder.due_date)
      : null;
    
    const today = new Date();
    
    if (dueDate) {
      dueDate.setHours(0, 0, 0, 0);
    }
    
    today.setHours(0, 0, 0, 0);
    
    const isOverdue =
      dueDate !== null &&
      dueDate < today &&
      workOrder.status !== "Completed";
    
      const matchesStatus =
  (statusFilter === "All" ||
    workOrder.status === statusFilter) &&
  (!statusFromUrl ||
    (statusFromUrl === "active"
      ? workOrder.status === "Open" ||
        workOrder.status === "In Progress"
      : workOrder.status === statusFromUrl));
      const matchesAssignedUser =
      (assignedUserFilter === "All" || 
        workOrder.assigned_user_id === assignedUserFilter) &&
      (!assignedUserFromUrl ||
        workOrder.assigned_user_id === assignedUserFromUrl);
      const matchesPriority =
  priorityFilter === "All" ||
  workOrder.priority === priorityFilter;
  const matchesAssignedToMe =
  !showAssignedToMe ||
  (
    workOrder.assigned_user_id === user?.id &&
    workOrder.status !== "Completed"
  );
    
    const matchesSearch =
      workOrder.title?.toLowerCase().includes(search) ||
      workOrder.description?.toLowerCase().includes(search) ||
      property?.name?.toLowerCase().includes(search);
    
      return (
        matchesAssignedToMe &&
        matchesAssignedUser &&
        (!showOverdue && !overdueFromUrl || isOverdue) &&
        (!showDueToday ||
          workOrder.due_date ===
            new Date().toISOString().split("T")[0]) &&
        (!showDueThisWeek || (() => {
          if (!workOrder.due_date) return false;
          if (workOrder.status === "Completed") return false;
      
          const today = new Date();
          today.setHours(0, 0, 0, 0);
      
          const weekFromToday = new Date(today);
          weekFromToday.setDate(today.getDate() + 7);
      
          const [year, month, day] = workOrder.due_date
            .split("-")
            .map(Number);
      
          const dueDate = new Date(year, month - 1, day);
          dueDate.setHours(0, 0, 0, 0);
      
          return dueDate >= today && dueDate <= weekFromToday;
        })()) &&
        matchesStatus &&
        matchesPriority &&
        matchesSearch
      ); 
  }
)
.sort((a, b) => {
  if (sortOption === "due_soonest") {
    const aDate = a.due_date
      ? new Date(a.due_date).getTime()
      : Infinity;

    const bDate = b.due_date
      ? new Date(b.due_date).getTime()
      : Infinity;

    return aDate - bDate;
  }

  if (sortOption === "due_latest") {
    const aDate = a.due_date
      ? new Date(a.due_date).getTime()
      : -Infinity;

    const bDate = b.due_date
      ? new Date(b.due_date).getTime()
      : -Infinity;

    return bDate - aDate;
  }

  if (sortOption === "priority_high") {
    const priorityOrder: Record<string, number> = {
      Urgent: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return (
      (priorityOrder[b.priority ?? ""] || 0) -
      (priorityOrder[a.priority ?? ""] || 0)
    );
  }

  if (sortOption === "priority_low") {
    const priorityOrder: Record<string, number> = {
      Urgent: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return (
      (priorityOrder[a.priority ?? ""] || 0) -
      (priorityOrder[b.priority ?? ""] || 0)
    );
  }

  if (sortOption === "newest") {
    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  }

  if (sortOption === "oldest") {
    return (
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
    );
  }

  return 0;
})
.map((workOrder) => (
  <div
  key={workOrder.id}
  className={`relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm ${
    workOrder.status === "Completed"
      ? "border-gray-300"
      : "border-gray-200"
  }`}
>
{workOrder.status === "Completed" && (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
     <div className="-rotate-12 rounded-lg border-4 border-emerald-600 px-10 py-4 text-6xl font-black tracking-[0.2em] text-emerald-600 opacity-30 shadow-sm">
  CLOSED
</div>
    </div>
  )} 
 <div className="flex flex-col justify-between gap-4 md:flex-row">
  <div>
    <div className="flex items-center gap-3">
      <h2 className="text-xl font-semibold text-gray-900">
        {workOrder.title}
      </h2>

      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          workOrder.priority === "Urgent"
            ? "bg-red-100 text-red-700"
            : workOrder.priority === "High"
            ? "bg-orange-100 text-orange-700"
            : workOrder.priority === "Medium"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {workOrder.priority || "Low"}
      </span>
    </div>

    <Link
      href={`/work-orders/${workOrder.id}`}
      className="mt-1 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      View Work Order →
    </Link>

    <Link
      href={`/properties/${workOrder.property_id}`}
      className="mt-1 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
    >
      {getPropertyName(workOrder.property_id)}
    </Link>

    {workOrder.description && (
      <p className="mt-3 text-gray-600">
        {workOrder.description}
      </p>
    )}
  </div>

  <div className="flex flex-wrap gap-2">
    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
      {workOrder.status || "Open"}
    </span>

    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        workOrder.priority === "Urgent"
          ? "bg-red-100 text-red-700"
          : workOrder.priority === "High"
          ? "bg-orange-100 text-orange-700"
          : workOrder.priority === "Medium"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {workOrder.priority || "Low"}
    </span>
  </div>
</div> 
              <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Due Date
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                  {workOrder.due_date
  ? (() => {
      const [year, month, day] = workOrder.due_date.split("-");
      return `${month}/${day}/${year}`;
    })()
  : "Not set"}
</p>
                </div>
                <div>
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
    Assigned To
  </p>

  <p className="mt-1 text-sm text-gray-900">
    {workOrder.assigned_user_id
      ? teamMembers.find(
          (member) => member.id === workOrder.assigned_user_id
        )?.full_name || "Assigned user"
      : workOrder.assigned_to || "Not assigned"}
  </p>
</div>

<div>
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
    Completed On
  </p>

  <p className="mt-1 text-sm text-gray-900">
  {workOrder.completed_at
  ? new Date(workOrder.completed_at).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  : "Not completed"}
  </p>
</div>            

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estimated Cost
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {workOrder.estimated_cost !== null
                      ? `$${Number(workOrder.estimated_cost).toFixed(2)}`
                      : "Not set"}
                  </p>
                </div>
              </div>

              {workOrder.actual_cost !== null && (
                <div className="mt-4 text-sm text-gray-600">
                  Actual Cost:{" "}
                  <span className="font-semibold text-gray-900">
                    ${Number(workOrder.actual_cost).toFixed(2)}
                  </span>
                </div>
              )}

              {workOrder.completion_notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Completion Notes
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {workOrder.completion_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
     </div>
  </AppLayout>
  );
}
export default function WorkOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading work orders...
        </div>
      }
    >
      <WorkOrdersContent />
    </Suspense>
  );
}