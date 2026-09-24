"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type MaintenanceTemplate = {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  is_active: boolean;
};
type MaintenanceTemplateItem = {
    id: string;
    name: string;
    description: string | null;
    recommended_month: number | null;
    sort_order: number;
    is_active: boolean;
  };

export default function MaintenancePlanPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const params = useParams();

  const planId = params.id as string;

  const [plan, setPlan] = useState<MaintenanceTemplate | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [items, setItems] = useState<MaintenanceTemplateItem[]>([]);
  type Property = {
    id: string;
    name: string;
  };
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
const [savingAssignment, setSavingAssignment] = useState(false);
const [assignedProperties, setAssignedProperties] = useState<Property[]>([]);
  const [itemName, setItemName] = useState("");
const [itemDescription, setItemDescription] = useState("");
const [recommendedMonth, setRecommendedMonth] = useState("");
const [savingItem, setSavingItem] = useState(false);
async function handleAssignPlan() {
    if (!user || !planId) return;
  
    if (!selectedPropertyId) {
      alert("Please select a property.");
      return;
    }
  
    if (!plan) {
      alert("Maintenance plan could not be loaded.");
      return;
    }
  
    setSavingAssignment(true);
  
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
  
    if (profileError || !profile?.organization_id) {
      console.error("Error loading profile:", profileError);
      alert("Unable to determine your organization.");
      setSavingAssignment(false);
      return;
    }
  
    const { error } = await supabase
      .from("property_maintenance_plans")
      .insert({
        organization_id: profile.organization_id,
        property_id: selectedPropertyId,
        template_id: planId,
        name: plan.name,
        description: plan.description,
        is_active: true,
      });
  
    if (error) {
      console.error("Error assigning maintenance plan:", error);
      alert("Unable to assign maintenance plan.");
      setSavingAssignment(false);
      return;
    }
  
    setSelectedPropertyId("");
    setSavingAssignment(false);
  
    document
      .getElementById("assign-maintenance-plan-form")
      ?.classList.add("hidden");
  
    alert("Maintenance plan assigned successfully.");
  }
async function handleCreateItem() {
    if (!user || !planId) return;
  
    if (!itemName.trim()) {
      alert("Please enter a maintenance item name.");
      return;
    }
  
    setSavingItem(true);
  
    const { error } = await supabase
      .from("maintenance_template_items")
      .insert({
        template_id: planId,
        name: itemName.trim(),
        description: itemDescription.trim() || null,
        recommended_month: recommendedMonth
          ? Number(recommendedMonth)
          : null,
        sort_order: 0,
        is_active: true,
      });
  
    if (error) {
        console.error(
            "Error creating maintenance item:",
            error.message,
            error.details,
            error.hint,
            error.code
          );
      alert("Unable to create maintenance item.");
      setSavingItem(false);
      return;
    }
  
    setItemName("");
    setItemDescription("");
    setRecommendedMonth("");
    setSavingItem(false);
    
    document
      .getElementById("create-maintenance-item-form")
      ?.classList.add("hidden");
    
    const { data: refreshedItems, error: refreshError } = await supabase
      .from("maintenance_template_items")
      .select(
        "id, name, description, recommended_month, sort_order, is_active"
      )
      .eq("template_id", planId)
      .order("sort_order")
      .order("created_at");
    
    if (refreshError) {
      console.error("Error refreshing maintenance items:", refreshError);
      return;
    }
    
    setItems(refreshedItems ?? []);
  }
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (!loading && user && role === "Client") {
      router.push("/client-portal");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    async function loadPlan() {
      if (!user || role === "Client" || !planId) return;
  
      setLoadingPlan(true);
  
      const { data, error } = await supabase
        .from("maintenance_templates")
        .select("id, name, description, season, is_active")
        .eq("id", planId)
        .single();
  
      if (error) {
        console.error("Error loading maintenance plan:", error);
        setPlan(null);
      } else {
        setPlan(data);
      }
  
      const { data: maintenanceItems, error: itemsError } = await supabase
        .from("maintenance_template_items")
        .select(
          "id, name, description, recommended_month, sort_order, is_active"
        )
        .eq("template_id", planId)
        .order("sort_order")
        .order("created_at");
  
      if (itemsError) {
        console.error("Error loading maintenance items:", itemsError);
        setItems([]);
      } else {
        console.log("Maintenance items loaded:", maintenanceItems);
        setItems(maintenanceItems ?? []);
      }
  
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("id, name")
        .order("name");
  
      if (propertyError) {
        console.error("Error loading properties:", propertyError);
        setProperties([]);
      } else {
        setProperties(propertyData ?? []);
      }
  
      const {
        data: assignedPropertyData,
        error: assignedPropertyError,
      } = await supabase
        .from("property_maintenance_plans")
        .select(`
          property_id,
          properties (
            id,
            name
          )
        `)
        .eq("template_id", planId);
  
      if (assignedPropertyError) {
        console.error(
          "Error loading assigned properties:",
          assignedPropertyError
        );
        setAssignedProperties([]);
      } else {
        const uniqueAssignedProperties = new Map<string, Property>();
  
        (assignedPropertyData ?? []).forEach((item) => {
          const property = item.properties as Property | null;
  
          if (property) {
            uniqueAssignedProperties.set(property.id, property);
          }
        });
  
        setAssignedProperties(
          Array.from(uniqueAssignedProperties.values())
        );
      }
  
      setLoadingPlan(false);
    }
  
    loadPlan();
  }, [user, role, planId]);
    
  
  return (
    <AppLayout>
      <div className="space-y-8">
        <button
          type="button"
          onClick={() => router.push("/maintenance")}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Maintenance
        </button>

        {loadingPlan ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading maintenance plan...
            </p>
          </div>
        ) : !plan ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-xl font-semibold text-red-800">
              Maintenance Plan Not Found
            </h1>
            <p className="mt-2 text-sm text-red-700">
              The maintenance plan could not be found.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {plan.name}
                  </h1>

                  {plan.season && (
                    <p className="mt-2 text-sm font-medium text-blue-600">
                      {plan.season}
                    </p>
                  )}

                  {plan.description && (
                    <p className="mt-4 max-w-3xl text-gray-600">
                      {plan.description}
                    </p>
                  )}
                </div>
                <button
  type="button"
  onClick={() => {
    document
      .getElementById("assign-maintenance-plan-form")
      ?.classList.toggle("hidden");
  }}
  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
>
  Assign to Property
</button>
<div
  id="assign-maintenance-plan-form"
  className="mt-6 hidden rounded-xl border border-gray-200 bg-gray-50 p-6"
>
  <h2 className="text-lg font-semibold text-gray-900">
    Assign Maintenance Plan
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Choose a property to assign this maintenance plan to.
  </p>

  <div className="mt-4">
    <label
      htmlFor="property-select"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Property
    </label>

    <select
  id="property-select"
  value={selectedPropertyId}
onChange={(e) => setSelectedPropertyId(e.target.value)}
  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900"
  
>
  <option value="">Select a property</option>

  {properties.map((property) => (
    <option key={property.id} value={property.id}>
      {property.name}
    </option>
  ))}
</select>
  </div>

  <div className="mt-5 flex gap-3">
    <button
      type="button"
      onClick={() => {
        document
          .getElementById("assign-maintenance-plan-form")
          ?.classList.add("hidden");
      }}
      className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
    >
      Cancel
    </button>

    <button
  type="button"
  onClick={handleAssignPlan}
  disabled={savingAssignment}
  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {savingAssignment ? "Assigning..." : "Assign Plan"}
</button>
  </div>
</div>

                <span
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    plan.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
  <h2 className="text-xl font-semibold text-gray-900">
    Assigned Properties
  </h2>

  {assignedProperties.length === 0 ? (
    <p className="mt-4 text-sm text-gray-500">
      This maintenance plan is not assigned to any properties yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {assignedProperties.map((property) => (
        <div
          key={property.id}
          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
        >
          <p className="font-medium text-gray-900">
            {property.name}
          </p>

          <p className="mt-1 text-xs font-medium text-green-600">
            Active
          </p>
        </div>
      ))}
    </div>
  )}
</div>
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Maintenance Items
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Maintenance tasks included in this seasonal plan.
                  </p>
                </div>

                <button
  type="button"
  onClick={() => {
    document
      .getElementById("create-maintenance-item-form")
      ?.classList.toggle("hidden");
  }}
  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
>
  + Add Maintenance Item
</button>
              </div>
              <div
  id="create-maintenance-item-form"
  className="mb-6 hidden rounded-xl border border-gray-200 bg-gray-50 p-6"
>
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-900">
      Add Maintenance Item
    </h3>

    <p className="mt-1 text-sm text-gray-500">
      Add a maintenance task to this seasonal plan.
    </p>
  </div>

  <div className="grid gap-6 md:grid-cols-2">
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Item Name
      </label>

      <input
        type="text"
        placeholder="Example: HVAC Service"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Recommended Month
      </label>

      <select
        value={recommendedMonth}
        onChange={(e) => setRecommendedMonth(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Select a month</option>
        <option value="1">January</option>
        <option value="2">February</option>
        <option value="3">March</option>
        <option value="4">April</option>
        <option value="5">May</option>
        <option value="6">June</option>
        <option value="7">July</option>
        <option value="8">August</option>
        <option value="9">September</option>
        <option value="10">October</option>
        <option value="11">November</option>
        <option value="12">December</option>
      </select>
    </div>
  </div>

  <div className="mt-6">
    <label className="mb-2 block text-sm font-medium text-gray-700">
      Description
    </label>

    <textarea
      rows={4}
      placeholder="Describe what should be checked or completed..."
      value={itemDescription}
      onChange={(e) => setItemDescription(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>

  <div className="mt-6 flex gap-3">
  <button
  type="button"
  onClick={handleCreateItem}
  disabled={savingItem}
  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {savingItem ? "Saving..." : "Save Maintenance Item"}
</button>

    <button
      type="button"
      onClick={() => {
        document
          .getElementById("create-maintenance-item-form")
          ?.classList.add("hidden");
      }}
      className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      Cancel
    </button>
  </div>
</div>
{items.length === 0 ? (
  <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
    <h3 className="text-lg font-semibold text-gray-900">
      No maintenance items yet
    </h3>

    <p className="mt-2 text-sm text-gray-500">
      Add the first maintenance item to this plan.
    </p>
  </div>
) : (
  <div className="mt-6 space-y-4">
    {items.map((item) => (
      <div
        key={item.id}
        className="rounded-xl border border-gray-200 bg-white p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {item.name}
            </h3>

            {item.description && (
              <p className="mt-2 text-sm text-gray-600">
                {item.description}
              </p>
            )}
          </div>

          {item.recommended_month && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Month {item.recommended_month}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
)}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}