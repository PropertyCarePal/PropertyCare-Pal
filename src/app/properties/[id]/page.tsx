
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Property = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  property_type: string | null;
};
type PropertyContact = {
  id: string;
  organization_id: string;
  property_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
type PropertyAccess = {
  id: string;
  organization_id: string;
  property_id: string;
  gate_code: string | null;
  alarm_information: string | null;
  lockbox_code: string | null;
  access_instructions: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
};
type Tab = "Overview" | "Assets" | "Work Orders" | "Service History";

export default function PropertyDetailsPage() {
  const params = useParams();
  console.log("PROPERTY PARAMS:", params);
  const { user, loading } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [editingContact, setEditingContact] = useState(false);
const [contactName, setContactName] = useState("");
const [contactEmail, setContactEmail] = useState("");
const [contactPhone, setContactPhone] = useState("");
const [contactNotes, setContactNotes] = useState("");
const [savingContact, setSavingContact] = useState(false);
const [propertyAccess, setPropertyAccess] =
  useState<PropertyAccess | null>(null);

const [editingAccess, setEditingAccess] = useState(false);
const [gateCode, setGateCode] = useState("");
const [alarmInformation, setAlarmInformation] = useState("");
const [lockboxCode, setLockboxCode] = useState("");
const [accessInstructions, setAccessInstructions] = useState("");
const [privateNotes, setPrivateNotes] = useState("");
const [savingAccess, setSavingAccess] = useState(false);
  const [propertyContact, setPropertyContact] =
  useState<PropertyContact | null>(null);

const [loadingContact, setLoadingContact] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [assets, setAssets] = useState<any[]>([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetManufacturer, setAssetManufacturer] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [assetSerialNumber, setAssetSerialNumber] = useState("");
  const [assetInstallDate, setAssetInstallDate] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
const [workOrderTitle, setWorkOrderTitle] = useState("");
const [workOrderPriority, setWorkOrderPriority] = useState("Medium"); 
const [workOrderDescription, setWorkOrderDescription] = useState("");
const [workOrderDueDate, setWorkOrderDueDate] = useState("");
const [workOrderStatus, setWorkOrderStatus] = useState("Open");
const [workOrderAssignedTo, setWorkOrderAssignedTo] = useState("");
const [workOrderEstimatedCost, setWorkOrderEstimatedCost] = useState("");
const [workOrderActualCost, setWorkOrderActualCost] = useState("");
const [workOrderCompletionNotes, setWorkOrderCompletionNotes] = useState("");
const [workOrderCompletedAt, setWorkOrderCompletedAt] = useState("");
const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);
  async function addAsset() {
    if (!user || !params.id) return;
    console.log("WORK ORDER STATUS:", workOrderStatus);
  
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
  
    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
      alert("Unable to find your organization.");
      return;
    }
    
    console.log("ASSET INSERT DATA:", {
        organization_id: profile.organization_id,
        property_id: params.id,
        name: assetName,
        asset_type: assetType,
      });
    const { error } = await supabase
      .from("assets")
      .insert({
        organization_id: profile.organization_id,
        property_id: params.id,
        name: assetName,
        asset_type: assetType,
        manufacturer: assetManufacturer,
        model: assetModel,
        serial_number: assetSerialNumber,
        install_date: assetInstallDate || null,
        notes: assetNotes,
        status: "Active",
      });
  
      if (error) {
        console.error("ASSET INSERT ERROR MESSAGE:", error.message);
        console.error("ASSET INSERT ERROR DETAILS:", error.details);
        console.error("ASSET INSERT ERROR HINT:", error.hint);
        console.error("ASSET INSERT ERROR CODE:", error.code);
      
        alert(
          `ASSET SAVE FAILED\n\n` +
          `Message: ${error.message}\n` +
          `Details: ${error.details}\n` +
          `Hint: ${error.hint}\n` +
          `Code: ${error.code}`
        );
      
        return;
      }
      
      console.log("ASSET INSERT SUCCESS");
  
    setAssetName("");
    setAssetType("");
    setAssetManufacturer("");
    setAssetModel("");
    setAssetSerialNumber("");
    setAssetInstallDate("");
    setAssetNotes("");
    setShowAssetForm(false);
  
    alert("Asset saved successfully!");
}
function editWorkOrder(workOrder: any) {
    setEditingWorkOrderId(workOrder.id);
  
    setWorkOrderTitle(workOrder.title || "");
    setWorkOrderDescription(workOrder.description || "");
    setWorkOrderPriority(workOrder.priority || "Medium");
    setWorkOrderDueDate(workOrder.due_date || "");
    setWorkOrderStatus(workOrder.status || "Open");
    setWorkOrderAssignedTo(workOrder.assigned_to || "");
  
    setWorkOrderEstimatedCost(
      workOrder.estimated_cost !== null &&
        workOrder.estimated_cost !== undefined
        ? String(workOrder.estimated_cost)
        : ""
    );
  
    setWorkOrderActualCost(
      workOrder.actual_cost !== null &&
        workOrder.actual_cost !== undefined
        ? String(workOrder.actual_cost)
        : ""
    );
  
    setWorkOrderCompletionNotes(workOrder.completion_notes || "");
  
    setShowWorkOrderForm(true);
  }
async function addWorkOrder() {
  if (!user || !params.id) return;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("PROFILE ERROR:", profileError);
    alert("Unable to find your organization.");
    return;
  }
  
  const { data, error } = await supabase
  .from("work_orders")
  .insert({
    organization_id: profile.organization_id,
    property_id: String(params.id),
    title: workOrderTitle,
    description: workOrderDescription,
    priority: workOrderPriority,
    due_date: workOrderDueDate || null,
    status: workOrderStatus,
    assigned_to: workOrderAssignedTo,
    estimated_cost: workOrderEstimatedCost
      ? Number(workOrderEstimatedCost)
      : null,
    actual_cost: workOrderActualCost
      ? Number(workOrderActualCost)
      : null,
    completion_notes: workOrderCompletionNotes,
    completed_at:
    workOrderStatus === "Completed"
      ? new Date().toISOString()
      : null,
  })
  .select()
  .single();

console.log("SAVED WORK ORDER:", data);
console.log("SAVED COMPLETED AT:", data?.completed_at);

  if (error) {
    console.error("WORK ORDER INSERT ERROR:", error);
    alert(`Unable to save work order.\n\n${error.message}`);
    return;
  }

  console.log("WORK ORDER SAVED:", data);

  setWorkOrders((current) => [data, ...current]);

  setWorkOrderTitle("");
  setWorkOrderDescription("");
  setWorkOrderPriority("Medium");
  setWorkOrderDueDate("");
  setWorkOrderStatus("Open"); 
  setShowWorkOrderForm(false);

  alert("Work order saved successfully.");
}
async function updateWorkOrderStatus(
    workOrderId: string,
    newStatus: string
  ) {
    const { data, error } = await supabase
  .from("work_orders")
  .update({ status: newStatus })
  .eq("id", workOrderId)
  .select();
  
    if (error) {
      console.error("WORK ORDER STATUS UPDATE ERROR:", error);
      alert(`Unable to update work order.\n\n${error.message}`);
      return;
    }
  
    if (!data || data.length === 0) {
        alert("Work order was not updated.");
        return;
      }
      
      setWorkOrders((current) =>
        current.map((workOrder) =>
          workOrder.id === workOrderId ? data[0] : workOrder
        )
      );
  }
  async function savePropertyContact() {
    if (!user || !property) return;
  
    if (!contactName.trim()) {
      alert("Please enter the homeowner or client name.");
      return;
    }
  
    setSavingContact(true);
  
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
  
      if (profileError || !profile) {
        console.error("PROFILE ERROR:", profileError);
        alert("Unable to determine your organization.");
        return;
      }
  
      const contactPayload = {
        organization_id: profile.organization_id,
        property_id: property.id,
        full_name: contactName.trim(),
        email: contactEmail.trim() || null,
        phone: contactPhone.trim() || null,
        notes: contactNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };
  
      let result;
  
      if (propertyContact) {
        result = await supabase
          .from("property_contacts")
          .update(contactPayload)
          .eq("id", propertyContact.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("property_contacts")
          .insert(contactPayload)
          .select()
          .single();
      }
  
      if (result.error) {
        console.error("PROPERTY CONTACT SAVE ERROR:", result.error);
        alert(`Unable to save client.\n\n${result.error.message}`);
        return;
      }
  
      setPropertyContact(result.data);
      setEditingContact(false);
  
      alert("Client information saved successfully.");
    } finally {
      setSavingContact(false);
    }
  }
  async function savePropertyAccess() {
    if (!user || !property) return;
  
    setSavingAccess(true);
  
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
  
      if (profileError || !profile) {
        console.error("PROFILE ERROR:", profileError);
        alert("Unable to determine your organization.");
        return;
      }
  
      const accessPayload = {
        organization_id: profile.organization_id,
        property_id: property.id,
        gate_code: gateCode.trim() || null,
        alarm_information: alarmInformation.trim() || null,
        lockbox_code: lockboxCode.trim() || null,
        access_instructions: accessInstructions.trim() || null,
        private_notes: privateNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };
  
      let result;
  
      if (propertyAccess) {
        result = await supabase
          .from("property_access")
          .update(accessPayload)
          .eq("id", propertyAccess.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("property_access")
          .insert(accessPayload)
          .select()
          .single();
      }
  
      if (result.error) {
        console.error("PROPERTY ACCESS SAVE ERROR:", result.error);
        alert(`Unable to save private access information.\n\n${result.error.message}`);
        return;
      }
  
      setPropertyAccess(result.data);
      setEditingAccess(false);
  
      alert("Private access information saved successfully.");
    } finally {
      setSavingAccess(false);
    }
  }

useEffect(() => {
    async function loadProperty() {
      if (!user || !params.id) {
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        setLoadingProperty(false);
        return;
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", params.id)
        .eq("organization_id", profile.organization_id)
        .single();

      if (error) {
        console.error("PROPERTY ERROR:", error);
        setLoadingProperty(false);
        return;
      }
      const { data: assetData, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("property_id", String(params.id))
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });
    
      if (assetError) {
        console.error("ASSET LOAD ERROR:", assetError);
        alert(`ASSET LOAD ERROR: ${assetError.message}`);
      } else {
        console.log("ASSETS LOADED:", assetData);
        setAssets(assetData || []);
      }
      setProperty(data);

const { data: contactData, error: contactError } = await supabase
  .from("property_contacts")
  .select("*")
  .eq("property_id", String(params.id))
  .eq("organization_id", profile.organization_id)
  .maybeSingle();

if (contactError) {
  console.error("PROPERTY CONTACT LOAD ERROR:", contactError);
} else {
  console.log("PROPERTY CONTACT LOADED:", contactData);
  setPropertyContact(contactData || null);
}
const { data: accessData, error: accessError } = await supabase
  .from("property_access")
  .select("*")
  .eq("property_id", String(params.id))
  .eq("organization_id", profile.organization_id)
  .maybeSingle();

if (accessError) {
  console.error("PROPERTY ACCESS LOAD ERROR:", accessError);
} else {
  console.log("PROPERTY ACCESS LOADED:", accessData);
  setPropertyAccess(accessData || null);
}

const { data: workOrderData, error: workOrderError } = await supabase
      .from("work_orders")
      .select("*")
      .eq("property_id", String(params.id))
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });
    
    if (workOrderError) {
      console.error("WORK ORDER LOAD ERROR:", workOrderError);
    } else {
      console.log("WORK ORDERS LOADED:", workOrderData);
      setWorkOrders(workOrderData || []);
    } 
      setLoadingProperty(false);
    }

    loadProperty();
  }, [user, params.id]);

  if (loading || loadingProperty) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading property...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Property not found
        </h1>
      </div>
    );
  }

  return (
    <div className="p-8">

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {property.name}
        </h1>

        <p className="mt-2 text-gray-600">
          {property.address}
          {property.city && ", " + property.city}
          {property.state && ", " + property.state}
        </p>
      </header>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex flex-wrap gap-6">

          {(
            [
              "Overview",
              "Assets",
              "Work Orders",
              "Service History",
            ] as Tab[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                "pb-3 text-sm font-medium transition " +
                (activeTab === tab
                  ? "border-b-2 border-emerald-600 text-emerald-700"
                  : "text-gray-500 hover:text-gray-900")
              }
            >
              {tab}
            </button>
          ))}

        </nav>
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">
                Property Status
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {property.status || "Not Set"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">
                Property Type
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {property.property_type || "Not Set"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">
                Property ID
              </p>

              <p className="mt-2 break-all font-mono text-sm text-gray-700">
                {property.id}
              </p>
            </div>

          </div>

          <div className="rounded-xl bg-white p-6 shadow">

            <h2 className="text-xl font-semibold text-gray-900">
              Property Information
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">
                  Address
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {property.address || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  City
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {property.city || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  State
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {property.state || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Property Type
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {property.property_type || "Not provided"}
                </p>
              </div>

            </div>
            <div className="rounded-xl bg-white p-6 shadow">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Homeowner / Client
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Contact information for this property
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setContactName(propertyContact?.full_name || "");
        setContactEmail(propertyContact?.email || "");
        setContactPhone(propertyContact?.phone || "");
        setContactNotes(propertyContact?.notes || "");
        setEditingContact(true);
      }}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
    >
      {propertyContact ? "Edit Client" : "Add Client"}
    </button>
  </div>

  {propertyContact ? (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Name
        </p>
        <p className="mt-1 text-gray-900">
          {propertyContact.full_name}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Email
        </p>
        <p className="mt-1 text-gray-900">
          {propertyContact.email || "Not provided"}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Phone
        </p>
        <p className="mt-1 text-gray-900">
          {propertyContact.phone || "Not provided"}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Notes
        </p>
        <p className="mt-1 whitespace-pre-wrap text-gray-900">
          {propertyContact.notes || "No notes"}
        </p>
      </div>
    </div>
  ) : (
    <p className="mt-6 text-sm text-gray-500">
      No homeowner or client information has been added yet.
    </p>
  )}
</div>
{editingContact && (
  <div className="rounded-xl bg-white p-6 shadow">
    <h2 className="text-lg font-semibold text-gray-900">
      {propertyContact ? "Edit Homeowner / Client" : "Add Homeowner / Client"}
    </h2>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Homeowner name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="(760) 555-1234"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          value={contactNotes}
          onChange={(e) => setContactNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="General notes about the homeowner or client..."
        />
      </div>
    </div>

    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={() => setEditingContact(false)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={savePropertyContact} 
        disabled={savingContact}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {savingContact ? "Saving..." : "Save Client"}
      </button>
    </div>
  </div>
)}
<div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Private Property Access
      </h2>

      <p className="mt-1 text-sm text-amber-700">
        Sensitive access information for authorized team members.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setGateCode(propertyAccess?.gate_code || "");
        setAlarmInformation(propertyAccess?.alarm_information || "");
        setLockboxCode(propertyAccess?.lockbox_code || "");
        setAccessInstructions(propertyAccess?.access_instructions || "");
        setPrivateNotes(propertyAccess?.private_notes || "");
        setEditingAccess(true);
      }}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
    >
      {propertyAccess ? "Edit Access" : "Add Access"}
    </button>
  </div>

  {propertyAccess ? (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Gate / Entry Code
        </p>
        <p className="mt-1 font-mono text-gray-900">
          {propertyAccess.gate_code || "Not provided"}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Alarm Information
        </p>
        <p className="mt-1 whitespace-pre-wrap font-mono text-gray-900">
          {propertyAccess.alarm_information || "Not provided"}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Lockbox Code
        </p>
        <p className="mt-1 font-mono text-gray-900">
          {propertyAccess.lockbox_code || "Not provided"}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Access Instructions
        </p>
        <p className="mt-1 whitespace-pre-wrap text-gray-900">
          {propertyAccess.access_instructions || "Not provided"}
        </p>
      </div>

      <div className="md:col-span-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Private Notes
        </p>
        <p className="mt-1 whitespace-pre-wrap text-gray-900">
          {propertyAccess.private_notes || "No private notes"}
        </p>
      </div>
    </div>
  ) : (
    <p className="mt-6 text-sm text-gray-600">
      No private access information has been added.
    </p>
  )}
</div>
{editingAccess && (
  <div className="rounded-xl border border-amber-200 bg-white p-6 shadow">
    <h2 className="text-lg font-semibold text-gray-900">
      {propertyAccess
        ? "Edit Private Property Access"
        : "Add Private Property Access"}
    </h2>

    <p className="mt-1 text-sm text-amber-700">
      This information should only be entered if you are authorized to store it.
    </p>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Gate / Entry Code
        </label>
        <input
          type="password"
          value={gateCode}
          onChange={(e) => setGateCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Gate or entry code"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Lockbox Code
        </label>
        <input
          type="password"
          value={lockboxCode}
          onChange={(e) => setLockboxCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Lockbox code"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Alarm Information
        </label>
        <textarea
          value={alarmInformation}
          onChange={(e) => setAlarmInformation(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Alarm instructions or information"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Access Instructions
        </label>
        <textarea
          value={accessInstructions}
          onChange={(e) => setAccessInstructions(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Instructions for authorized team members..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Private Notes
        </label>
        <textarea
          value={privateNotes}
          onChange={(e) => setPrivateNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Other private property information..."
        />
      </div>
    </div>

    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={() => setEditingAccess(false)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={savePropertyAccess}
        disabled={savingAccess}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {savingAccess ? "Saving..." : "Save Private Access"}
      </button>
    </div>
  </div>
)}
          </div>

        </div>
      )}

{activeTab === "Assets" && (
  <div className="rounded-xl bg-white p-8 shadow">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Assets
        </h2>

        <p className="mt-2 text-gray-600">
          Equipment and systems associated with this property.
        </p>
      </div>

      <button
  onClick={() => setShowAssetForm(!showAssetForm)}
  className="rounded-lg bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700"
>
  {showAssetForm ? "Cancel" : "Add Asset"}
</button>{showAssetForm && (
  <div className="mt-6 rounded-xl border border-gray-200 p-6">
    <h3 className="text-xl font-semibold text-gray-900">
      Add New Asset
    </h3>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      

<input
  placeholder="Asset Name"
  value={assetName}
  onChange={(e) => setAssetName(e.target.value)}
  className="rounded-lg border p-3"
/> 
<input
  placeholder="Asset Type"
  value={assetType}
  onChange={(e) => setAssetType(e.target.value)}
  className="rounded-lg border p-3"
/>
<input
  placeholder="Manufacturer"
  value={assetManufacturer}
  onChange={(e) => setAssetManufacturer(e.target.value)}
  className="rounded-lg border p-3"
/>

<input
  placeholder="Model"
  value={assetModel}
  onChange={(e) => setAssetModel(e.target.value)}
  className="rounded-lg border p-3"
/>

<input
  placeholder="Serial Number"
  value={assetSerialNumber}
  onChange={(e) => setAssetSerialNumber(e.target.value)}
  className="rounded-lg border p-3"
/> 

<input
  type="date"
  value={assetInstallDate}
  onChange={(e) => setAssetInstallDate(e.target.value)}
  className="rounded-lg border p-3"
/>

<textarea
  placeholder="Notes"
  value={assetNotes}
  onChange={(e) => setAssetNotes(e.target.value)}
  className="rounded-lg border p-3 md:col-span-2"
  rows={4}
/>
    </div>
    <button
  onClick={addAsset}
  className="mt-5 rounded-lg bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700"
>
  Save Asset
</button>
  </div>
)}
    </div>

    <div className="mt-6 space-y-4">
  {assets.length === 0 ? (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
      <p className="text-gray-500">
        No assets added yet.
      </p>
    </div>
  ) : (
    assets.map((asset) => (
      <div
        key={asset.id}
        className="rounded-xl border border-gray-200 bg-gray-50 p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Asset
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              {asset.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Type
            </p>
            <p className="mt-1 text-gray-900">
              {asset.asset_type || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Manufacturer
            </p>
            <p className="mt-1 text-gray-900">
              {asset.manufacturer || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Model
            </p>
            <p className="mt-1 text-gray-900">
              {asset.model || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Serial Number
            </p>
            <p className="mt-1 text-gray-900">
              {asset.serial_number || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Install Date
            </p>
            <p className="mt-1 text-gray-900">
              {asset.install_date || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Status
            </p>
            <p className="mt-1 text-gray-900">
              {asset.status || "Not provided"}
            </p>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <p className="text-xs font-medium uppercase text-gray-500">
              Notes
            </p>
            <p className="mt-1 text-gray-900">
              {asset.notes || "No notes"}
            </p>
          </div>

        </div>
      </div>
    ))
  )}
</div>
  </div>
)}

{activeTab === "Work Orders" && (
  <div className="rounded-xl bg-white p-8 shadow">
 <div className="flex items-center justify-between">
  <div>
    <h2 className="text-2xl font-semibold text-gray-900">
      Work Orders
    </h2>

    <p className="mt-2 text-gray-600">
      Maintenance work orders will appear here.
    </p>
  </div>

  <button
    onClick={() => setShowWorkOrderForm(!showWorkOrderForm)}
    className="rounded-lg bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700"
  >
    {showWorkOrderForm ? "Cancel" : "Add Work Order"}
  </button>
</div> 
{showWorkOrderForm && (
  <div className="mt-6 rounded-xl border border-gray-200 p-6">
    <h3 className="text-xl font-semibold text-gray-900">
      Add New Work Order
    </h3>

    <div className="mt-5">
      <input
        placeholder="Work Order Title"
        value={workOrderTitle}
        onChange={(e) => setWorkOrderTitle(e.target.value)}
        className="w-full rounded-lg border p-3"
      />
      <textarea
  placeholder="Description"
  value={workOrderDescription}
  onChange={(e) => setWorkOrderDescription(e.target.value)}
  className="mt-4 w-full rounded-lg border p-3"
  rows={4}
/>
<select
  value={workOrderPriority}
  onChange={(e) => setWorkOrderPriority(e.target.value)}
  className="mt-4 w-full rounded-lg border p-3"
>
  <option value="Low">Low Priority</option>
  <option value="Medium">Medium Priority</option>
  <option value="High">High Priority</option>
  <option value="Urgent">Urgent</option>
</select>
<input
  type="date"
  value={workOrderDueDate}
  onChange={(e) => setWorkOrderDueDate(e.target.value)}
  className="mt-4 w-full rounded-lg border p-3"
/>
<select
  value={workOrderStatus}
  onChange={(e) => setWorkOrderStatus(e.target.value)}
  className="mt-4 w-full rounded-lg border p-3"
>
  <option value="Open">Open</option>
  <option value="In Progress">In Progress</option>
  <option value="Completed">Completed</option>
  <option value="Cancelled">Cancelled</option>
</select>

<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Assigned To
  </label>

  <input
    type="text"
    value={workOrderAssignedTo}
    onChange={(e) => setWorkOrderAssignedTo(e.target.value)}
    placeholder="Contractor or vendor name"
    className="mt-1 w-full rounded-lg border border-gray-300 p-3"
  />
</div>
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Estimated Cost
  </label>

  <input
    type="number"
    min="0"
    step="0.01"
    value={workOrderEstimatedCost}
    onChange={(e) => setWorkOrderEstimatedCost(e.target.value)}
    placeholder="0.00"
    className="mt-1 w-full rounded-lg border border-gray-300 p-3"
  />
</div>
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Actual Cost
  </label>

  <input
    type="number"
    min="0"
    step="0.01"
    value={workOrderActualCost}
    onChange={(e) => setWorkOrderActualCost(e.target.value)}
    placeholder="0.00"
    className="mt-1 w-full rounded-lg border border-gray-300 p-3"
  />
</div>
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Completion Notes
  </label>

  <textarea
    value={workOrderCompletionNotes}
    onChange={(e) => setWorkOrderCompletionNotes(e.target.value)}
    placeholder="Describe the work completed..."
    rows={4}
    className="mt-1 w-full rounded-lg border border-gray-300 p-3"
  />
</div>

<button
  type="button"
  onClick={addWorkOrder}
  className="mt-5 rounded-lg bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700"
>
  Save Work Order
</button>
 

    </div>
  </div>
)}

    <div className="mt-6 space-y-4">
      {workOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            No work orders yet.
          </p>
        </div>
      ) : (
        workOrders.map((workOrder) => (
          <div
            key={workOrder.id}
            className="rounded-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {workOrder.title}
              </h3>
              <button
  type="button"
  onClick={() => editWorkOrder(workOrder)}
  className="ml-3 rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
>
  Edit
</button>

              <select
  value={workOrder.status}
  onChange={(e) =>
    updateWorkOrderStatus(workOrder.id, e.target.value)
  }
  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
>
  <option value="Open">Open</option>
  <option value="In Progress">In Progress</option>
  <option value="Completed">Completed</option>
  <option value="Cancelled">Cancelled</option>
</select> 
            </div>

            {workOrder.description && (
              <p className="mt-2 text-gray-600">
                {workOrder.description}
              </p>
            )}
{workOrder.completion_notes && (
  <div className="mt-3 rounded-lg bg-gray-50 p-3">
    <p className="text-sm font-medium text-gray-700">
      Completion Notes
    </p>

    <p className="mt-1 text-sm text-gray-600">
      {workOrder.completion_notes}
    </p>
  </div>
)}
            <div className="mt-3 flex gap-4 text-sm text-gray-500">
            {workOrder.assigned_to && (
  <span>
    Assigned To: {workOrder.assigned_to}
  </span>
)}
              <span>
                Priority: {workOrder.priority}
              </span>
              {workOrder.estimated_cost !== null &&
    workOrder.estimated_cost !== undefined && (
      <span>
        Estimated Cost: ${Number(workOrder.estimated_cost).toFixed(2)}
      </span>
    )}
    {workOrder.actual_cost !== null &&
  workOrder.actual_cost !== undefined && (
    <span>
      Actual Cost: ${Number(workOrder.actual_cost).toFixed(2)}
    </span>
  )}
  {workOrder.estimated_cost !== null &&
  workOrder.estimated_cost !== undefined &&
  workOrder.actual_cost !== null &&
  workOrder.actual_cost !== undefined && (
    <span>
      {Number(workOrder.actual_cost) <=
      Number(workOrder.estimated_cost)
        ? `$${(
            Number(workOrder.estimated_cost) -
            Number(workOrder.actual_cost)
          ).toFixed(2)} Under Estimate`
        : `$${(
            Number(workOrder.actual_cost) -
            Number(workOrder.estimated_cost)
          ).toFixed(2)} Over Estimate`}
    </span>
  )}

              {workOrder.due_date && (
                <span>
                  Due: {workOrder.due_date}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}

      {activeTab === "Service History" && (
        <div className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-semibold text-gray-900">
            Service History
          </h2>

          <p className="mt-2 text-gray-600">
            Property maintenance history will appear here.
          </p>

          <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">
              No service history yet.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

