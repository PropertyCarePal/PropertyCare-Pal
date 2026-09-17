
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

type Property = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  status: string | null;
  property_type: string | null;
};
type PropertyContactMethod = {
  id: string;
  property_contact_id: string;
  method_type: "email" | "phone";
  label: string;
  value: string;
  created_at: string;
  updated_at: string;
};

type PropertyContact = {
  id: string;
  organization_id: string;
  property_id: string;
  full_name: string;
  contact_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  methods: PropertyContactMethod[];
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

  const [editingProperty, setEditingProperty] = useState(false);
const [propertyName, setPropertyName] = useState("");
const [propertyAddress, setPropertyAddress] = useState("");
const [propertyCity, setPropertyCity] = useState("");
const [propertyState, setPropertyState] = useState("");
const [propertyZip, setPropertyZip] = useState("");
const [propertyType, setPropertyType] = useState("");
const [propertyStatus, setPropertyStatus] = useState("");
const [ownerName, setOwnerName] = useState("");
const [ownerEmail, setOwnerEmail] = useState("");
const [ownerPhone, setOwnerPhone] = useState("");
const [savingProperty, setSavingProperty] = useState(false);


const [propertyAccess, setPropertyAccess] =
  useState<PropertyAccess | null>(null);

const [editingAccess, setEditingAccess] = useState(false);
const [showPrivateAccess, setShowPrivateAccess] = useState(false);
const [gateCode, setGateCode] = useState("");
const [alarmInformation, setAlarmInformation] = useState("");
const [lockboxCode, setLockboxCode] = useState("");
const [accessInstructions, setAccessInstructions] = useState("");
const [privateNotes, setPrivateNotes] = useState("");
const [savingAccess, setSavingAccess] = useState(false);
const [propertyContacts, setPropertyContacts] = useState<PropertyContact[]>([]);
const [showContactForm, setShowContactForm] = useState(false);
const [contactFullName, setContactFullName] = useState("");
const [contactType, setContactType] = useState("");
const [contactEmail, setContactEmail] = useState("");
const [contactPhone, setContactPhone] = useState("");
const [editingContactId, setEditingContactId] = useState<string | null>(null);
const [loadingContacts, setLoadingContacts] = useState(true);
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
  const [teamMembers, setTeamMembers] = useState<
  {
    id: string;
    full_name: string | null;
    role: string | null;
    calendar_color: string | null;
  }[]
>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const teamMemberColors: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    orange: "bg-orange-500 hover:bg-orange-600",
    pink: "bg-pink-600 hover:bg-pink-700",
    cyan: "bg-cyan-600 hover:bg-cyan-700",
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    teal: "bg-teal-600 hover:bg-teal-700",
    rose: "bg-rose-600 hover:bg-rose-700",
  };

  function getTeamMemberColor(userId: string | null) {
    if (!userId) {
      return "bg-emerald-600 hover:bg-emerald-700";
    }

    const member = teamMembers.find((member) => member.id === userId);

    if (!member?.calendar_color) {
      return "bg-emerald-600 hover:bg-emerald-700";
    }

    return (
      teamMemberColors[member.calendar_color] ??
      "bg-emerald-600 hover:bg-emerald-700"
    );
  }


  function getCalendarDays(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }

  function formatCalendarMonth(date: Date) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function formatCalendarDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
const [workOrderTitle, setWorkOrderTitle] = useState("");
const [workOrderPriority, setWorkOrderPriority] = useState("Medium");
const [workOrderDescription, setWorkOrderDescription] = useState("");
const [workOrderDueDate, setWorkOrderDueDate] = useState("");
const [workOrderStatus, setWorkOrderStatus] = useState("Open");
const [workOrderAssignedTo, setWorkOrderAssignedTo] = useState("");
const [workOrderAssignedUserId, setWorkOrderAssignedUserId] = useState("");
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
    setWorkOrderAssignedUserId(workOrder.assigned_user_id || "");

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
  async function deleteWorkOrder() {
    if (!editingWorkOrderId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this work order? This cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("work_orders")
      .delete()
      .eq("id", editingWorkOrderId);

    if (error) {
      console.error("WORK ORDER DELETE ERROR:", error);
      alert(`Unable to delete work order.\n\n${error.message}`);
      return;
    }

    setWorkOrders((current) =>
      current.filter(
        (workOrder) => workOrder.id !== editingWorkOrderId
      )
    );

    setEditingWorkOrderId(null);
    setShowWorkOrderForm(false);

    alert("Work order deleted successfully.");
  }
  async function saveProperty() {
    if (!user || !params.id) return;

    setSavingProperty(true);

    const { data, error } = await supabase
      .from("properties")
      .update({
        name: propertyName,
        address: propertyAddress,
        city: propertyCity,
        state: propertyState,
        zip_code: propertyZip,
        property_type: propertyType,
        status: propertyStatus,
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      console.error("PROPERTY UPDATE ERROR:", error);
      alert("Unable to save property information.");
      setSavingProperty(false);
      return;
    }

    setProperty(data);
    setEditingProperty(false);
    setSavingProperty(false);
    alert("Property information saved successfully.");
}

async function savePropertyContact() {
  if (!user || !params.id) return;

  if (!contactFullName.trim()) {
    alert("Please enter the contact's full name.");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("CONTACT PROFILE ERROR:", profileError);
    alert("Unable to find your organization.");
    return;
  }

  // EDIT EXISTING CONTACT
  if (editingContactId) {
    const { error: contactError } = await supabase
      .from("property_contacts")
      .update({
        full_name: contactFullName.trim(),
        contact_type: contactType || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingContactId)
      .eq("property_id", String(params.id))
      .eq("organization_id", profile.organization_id);

    if (contactError) {
      console.error("PROPERTY CONTACT UPDATE ERROR:", contactError);
      alert("Unable to update the property contact.");
      return;
    }

    // Remove existing email/phone methods so we can save the current form values.
    const { error: deleteMethodsError } = await supabase
      .from("property_contact_methods")
      .delete()
      .eq("property_contact_id", editingContactId);

    if (deleteMethodsError) {
      console.error(
        "PROPERTY CONTACT METHODS DELETE ERROR:",
        deleteMethodsError
      );
      alert("Unable to update the contact methods.");
      return;
    }

    const methods = [];

    if (contactEmail.trim()) {
      methods.push({
        property_contact_id: editingContactId,
        method_type: "email",
        label: "Email",
        value: contactEmail.trim(),
      });
    }

    if (contactPhone.trim()) {
      methods.push({
        property_contact_id: editingContactId,
        method_type: "phone",
        label: "Phone",
        value: contactPhone.trim(),
      });
    }

    if (methods.length > 0) {
      const { error: methodsError } = await supabase
        .from("property_contact_methods")
        .insert(methods);

      if (methodsError) {
        console.error(
          "PROPERTY CONTACT METHODS UPDATE ERROR:",
          methodsError
        );
        alert("Unable to save the updated contact methods.");
        return;
      }
    }

    const { data: refreshedContacts, error: refreshError } = await supabase
      .from("property_contacts")
      .select(`
        id,
        organization_id,
        property_id,
        full_name,
        contact_type,
        notes,
        created_at,
        updated_at,
        methods:property_contact_methods (
          id,
          property_contact_id,
          method_type,
          label,
          value,
          created_at,
          updated_at
        )
      `)
      .eq("property_id", String(params.id))
      .eq("organization_id", profile.organization_id)
      .order("full_name", { ascending: true });

    if (refreshError) {
      console.error("PROPERTY CONTACT REFRESH ERROR:", refreshError);
    } else {
      setPropertyContacts(refreshedContacts || []);
    }

    setEditingContactId(null);
    setContactFullName("");
    setContactType("");
    setContactEmail("");
    setContactPhone("");
    setShowContactForm(false);

    alert("Property contact updated successfully.");
    return;
  }

  // ADD NEW CONTACT
  const { data: contact, error: contactError } = await supabase
    .from("property_contacts")
    .insert({
      organization_id: profile.organization_id,
      property_id: String(params.id),
      full_name: contactFullName.trim(),
      contact_type: contactType || null,
    })
    .select("*")
    .single();

  if (contactError || !contact) {
    console.error("PROPERTY CONTACT INSERT ERROR:", contactError);
    alert("Unable to save the property contact.");
    return;
  }

  const methods = [];

  if (contactEmail.trim()) {
    methods.push({
      property_contact_id: contact.id,
      method_type: "email",
      label: "Email",
      value: contactEmail.trim(),
    });
  }

  if (contactPhone.trim()) {
    methods.push({
      property_contact_id: contact.id,
      method_type: "phone",
      label: "Phone",
      value: contactPhone.trim(),
    });
  }

  if (methods.length > 0) {
    const { error: methodsError } = await supabase
      .from("property_contact_methods")
      .insert(methods);

    if (methodsError) {
      console.error("PROPERTY CONTACT METHODS INSERT ERROR:", methodsError);

      await supabase
        .from("property_contacts")
        .delete()
        .eq("id", contact.id);

      alert("Unable to save the contact methods.");
      return;
    }
  }

  const { data: refreshedContacts, error: refreshError } = await supabase
    .from("property_contacts")
    .select(`
      id,
      organization_id,
      property_id,
      full_name,
      contact_type,
      notes,
      created_at,
      updated_at,
      methods:property_contact_methods (
        id,
        property_contact_id,
        method_type,
        label,
        value,
        created_at,
        updated_at
      )
    `)
    .eq("property_id", String(params.id))
    .eq("organization_id", profile.organization_id)
    .order("full_name", { ascending: true });

  if (refreshError) {
    console.error("PROPERTY CONTACT REFRESH ERROR:", refreshError);
  } else {
    setPropertyContacts(refreshedContacts || []);
  }

  setEditingContactId(null);
  setContactFullName("");
  setContactType("");
  setContactEmail("");
  setContactPhone("");
  setShowContactForm(false);

  alert("Property contact saved successfully.");
}
async function deletePropertyContact(contactId: string) {
  if (!user || !params.id) return;

  const confirmed = window.confirm(
    "Are you sure you want to delete this contact?"
  );

  if (!confirmed) {
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("CONTACT PROFILE ERROR:", profileError);
    alert("Unable to find your organization.");
    return;
  }

  const { error: deleteError } = await supabase
    .from("property_contacts")
    .delete()
    .eq("id", contactId)
    .eq("property_id", String(params.id))
    .eq("organization_id", profile.organization_id);

  if (deleteError) {
    console.error("PROPERTY CONTACT DELETE ERROR:", deleteError);
    alert("Unable to delete the property contact.");
    return;
  }

  setPropertyContacts((currentContacts) =>
    currentContacts.filter((contact) => contact.id !== contactId)
  );

  if (editingContactId === contactId) {
    setEditingContactId(null);
    setContactFullName("");
    setContactType("");
    setContactEmail("");
    setContactPhone("");
    setShowContactForm(false);
  }

  alert("Property contact deleted successfully.");
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

  const workOrderData = {
    organization_id: profile.organization_id,
    property_id: String(params.id),
    title: workOrderTitle,
    description: workOrderDescription,
    priority: workOrderPriority,
    due_date: workOrderDueDate || null,
    status: workOrderStatus,
    assigned_user_id: workOrderAssignedUserId || null,
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
  };

  let data;
  let error;

  if (editingWorkOrderId) {
    const result = await supabase
      .from("work_orders")
      .update(workOrderData)
      .eq("id", editingWorkOrderId)
      .select()
      .single();

    data = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from("work_orders")
      .insert(workOrderData)
      .select()
      .single();

    data = result.data;
    error = result.error;
  }

console.log("SAVED WORK ORDER:", data);
console.log("SAVED COMPLETED AT:", data?.completed_at);

  if (error) {
    console.error("WORK ORDER INSERT ERROR:", error);
    alert(`Unable to save work order.\n\n${error.message}`);
    return;
  }

  console.log("WORK ORDER SAVED:", data);

  setWorkOrders((current) => {
    if (editingWorkOrderId) {
      return current.map((workOrder) =>
        workOrder.id === editingWorkOrderId ? data : workOrder
      );
    }

    return [data, ...current];
  });

  setWorkOrderTitle("");
  setWorkOrderDescription("");
  setWorkOrderPriority("Medium");
  setWorkOrderDueDate("");
  setWorkOrderStatus("Open");
  setEditingWorkOrderId(null);
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
      const { data: teamMemberData, error: teamMemberError } = await supabase
      .from("profiles")
      .select("id, full_name, role, calendar_color")
      .eq("organization_id", profile.organization_id)
      .order("full_name", { ascending: true });

    if (teamMemberError) {
      console.error("TEAM MEMBERS LOAD ERROR:", teamMemberError);
    } else {
      console.log("TEAM MEMBERS LOADED:", teamMemberData);
      setTeamMembers(teamMemberData || []);
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

      setPropertyName(data.name || "");
      setPropertyAddress(data.address || "");
      setPropertyCity(data.city || "");
      setPropertyState(data.state || "");
      setPropertyZip(data.zip || "");
      setPropertyType(data.property_type || "");
      setPropertyStatus(data.status || "");
      setOwnerName(data.owner_name || "");
      setOwnerEmail(data.owner_email || "");
      setOwnerPhone(data.owner_phone || "");

      const { data: contactData, error: contactError } = await supabase
      .from("property_contacts")
      .select(`
        id,
        organization_id,
        property_id,
        full_name,
        contact_type,
        notes,
        created_at,
        updated_at,
        methods:property_contact_methods (
          id,
          property_contact_id,
          method_type,
          label,
          value,
          created_at,
          updated_at
        )
      `)
      .eq("property_id", String(params.id))
      .eq("organization_id", profile.organization_id)
      .order("full_name", { ascending: true });

      if (contactError) {
        console.error("PROPERTY CONTACTS LOAD ERROR:", contactError);
        setPropertyContacts([]);
      } else {
        console.log("PROPERTY CONTACTS LOADED:", contactData);
        setPropertyContacts(contactData || []);
      }
      setLoadingContacts(false);
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
      .select(`
        *,
        assigned_user:profiles!work_orders_assigned_user_id_fkey (
          id,
          full_name,
          role
        )
      `)
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
    <AppLayout>
      <div className="p-8">

      <header className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-teal-50" />

    <div className="relative flex items-center justify-between gap-6 px-6 py-7 md:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#102A43] text-white shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-7 w-7"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M9 21v-6h6v6" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            Property
          </p>

          <h1 className="mt-1 truncate text-3xl font-bold tracking-tight text-[#102A43] md:text-4xl">
            {property.name}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {property.address || "No address provided"}
            {property.city && `, ${property.city}`}
            {property.state && `, ${property.state}`}
            {property.zip_code && ` ${property.zip_code}`}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
            property.status?.toLowerCase() === "active"
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {property.status || "Active"}
        </span>
      </div>
    </div>
  </div>
</header>
<div className="mb-6 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
  <nav className="flex flex-wrap gap-1">
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
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
          activeTab === tab
            ? "bg-[#102A43] text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {tab}
      </button>
    ))}
  </nav>
</div>

      {activeTab === "Overview" && (
        <div className="space-y-6">

<div className="grid gap-5 md:grid-cols-3">
  <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Property Status
        </p>

        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          {property.status || "Not Set"}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Current property status
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      </div>
    </div>
  </div>

  <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Property Type
        </p>

        <p className="mt-4 truncate text-2xl font-bold tracking-tight text-gray-900">
          {property.property_type || "Not Set"}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Property classification
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-6h6v6" />
        </svg>
      </div>
    </div>
  </div>

  <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Property ID
        </p>

        <p className="mt-4 break-all font-mono text-sm font-semibold text-gray-900">
          {property.id}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Unique property identifier
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      </div>
    </div>
  </div>
</div>
<div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="border-b border-gray-100 px-6 py-5">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Property Information
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Property details and ownership information.
        </p>
      </div>

      {!editingProperty && (
        <button
          type="button"
          onClick={() => setEditingProperty(true)}
          className="rounded-xl bg-[#102A43] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md"
        >
          Edit Property
        </button>
      )}
    </div>
  </div>

  {editingProperty ? (
    <div className="p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Property Details
        </p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Property Name
            </label>

            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Address
            </label>

            <input
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              City
            </label>

            <input
              type="text"
              value={propertyCity}
              onChange={(e) => setPropertyCity(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              State
            </label>

            <input
              type="text"
              value={propertyState}
              onChange={(e) => setPropertyState(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ZIP Code
            </label>

            <input
              type="text"
              value={propertyZip}
              onChange={(e) => setPropertyZip(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Property Type
            </label>

            <input
              type="text"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>

            <input
              type="text"
              value={propertyStatus}
              onChange={(e) => setPropertyStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#102A43]">
          Property Owner
        </p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Owner Name
            </label>

            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Owner Email
            </label>

            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Owner Phone
            </label>

            <input
              type="tel"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => setEditingProperty(false)}
          disabled={savingProperty}
          className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveProperty}
          disabled={savingProperty}
          className="rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingProperty ? "Saving..." : "Save Property"}
        </button>
      </div>
    </div>
  ) : (
    <div className="p-6">
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            Address
          </p>

          <p className="mt-2 font-medium text-gray-900">
            {property.address || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            City
          </p>

          <p className="mt-2 font-medium text-gray-900">
            {property.city || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            State
          </p>

          <p className="mt-2 font-medium text-gray-900">
            {property.state || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            ZIP Code
          </p>

          <p className="mt-2 font-medium text-gray-900">
            {property.zip_code || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            Property Type
          </p>

          <p className="mt-2 font-medium text-gray-900">
            {property.property_type || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            Status
          </p>

          <p className="mt-2 font-medium text-gray-900">
            {property.status || "Not provided"}
          </p>
        </div>
      </div>
    </div>
  )}
</div>

<div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
  <div className="flex items-center justify-between">
    <div>
    <h2 className="text-xl font-semibold tracking-tight text-gray-900">
  Private Property Access
  </h2>
<p className="mt-1 text-sm text-amber-700">
  Sensitive access information for authorized team members.
</p>
    </div>
    {propertyAccess && (
  <button
    type="button"
    onClick={() => setShowPrivateAccess((current) => !current)}
   className="mr-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
  >
    {showPrivateAccess ? "Hide Access" : "Show Access"}
  </button>
)}

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
      className="rounded-xl bg-[#102A43] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md"
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
  {showPrivateAccess
    ? propertyAccess.gate_code || "Not provided"
    : propertyAccess.gate_code
      ? "••••••••"
      : "Not provided"}
</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Alarm Information
        </p>
        <p className="mt-1 whitespace-pre-wrap font-mono text-gray-900">
  {showPrivateAccess
    ? propertyAccess.alarm_information || "Not provided"
    : propertyAccess.alarm_information
      ? "••••••••••••"
      : "Not provided"}
</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Lockbox Code
        </p>
        <p className="mt-1 font-mono text-gray-900">
  {showPrivateAccess
    ? propertyAccess.lockbox_code || "Not provided"
    : propertyAccess.lockbox_code
      ? "••••••••"
      : "Not provided"}
</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Access Instructions
        </p>
        <p className="mt-1 whitespace-pre-wrap text-gray-900">
  {showPrivateAccess
    ? propertyAccess.access_instructions || "Not provided"
    : propertyAccess.access_instructions
      ? "••••••••••••"
      : "Not provided"}
</p>
      </div>

      <div className="md:col-span-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Private Notes
        </p>
        <p className="mt-1 whitespace-pre-wrap text-gray-900">
        {showPrivateAccess
  ? propertyAccess.private_notes || "No private notes"
  : propertyAccess.private_notes
    ? "••••••••••••"
    : "No private notes"}
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
               <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="border-b border-gray-100 px-6 py-5">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            <path d="M16 5.5a3 3 0 0 1 0 5.8" />
            <path d="M18 14.5a6 6 0 0 1 3 5.5" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Property Contacts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            People associated with this property.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setShowContactForm((current) => !current);
          setEditingContactId(null);
          setContactFullName("");
          setContactType("");
          setContactEmail("");
          setContactPhone("");
        }}
        className="rounded-xl bg-[#102A43] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md"
      >
        {showContactForm ? "Cancel" : "+ Add Contact"}
      </button>
    </div>
  </div>

  <div className="p-6">
    {showContactForm && (
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">
            {editingContactId ? "Edit Property Contact" : "Add Property Contact"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Enter the contact's information below.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              value={contactFullName}
              onChange={(e) => setContactFullName(e.target.value)}
              placeholder="Contact name"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Contact Type
            </label>

            <select
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select type</option>
              <option value="Owner">Owner</option>
              <option value="Property Manager">Property Manager</option>
              <option value="Tenant">Tenant</option>
              <option value="Vendor">Vendor</option>
              <option value="Emergency Contact">Emergency Contact</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone
            </label>

            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5">
          <button
            type="button"
            onClick={() => {
              setShowContactForm(false);
              setEditingContactId(null);
              setContactFullName("");
              setContactType("");
              setContactEmail("");
              setContactPhone("");
            }}
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={savePropertyContact}
            className="rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md"
          >
            {editingContactId ? "Update Contact" : "Save Contact"}
          </button>
        </div>
      </div>
    )}

    {loadingContacts ? (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">
          Loading contacts...
        </p>
      </div>
    ) : propertyContacts.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
        </div>

        <p className="mt-3 font-semibold text-gray-900">
          No contacts yet
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Add a contact associated with this property.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {propertyContacts.map((contact) => (
          <div
            key={contact.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="8" r="3" />
                    <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                    {contact.full_name}
                  </h3>

                  {contact.contact_type && (
                    <p className="mt-1 text-sm text-gray-500">
                      {contact.contact_type}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingContactId(contact.id);
                    setContactFullName(contact.full_name);
                    setContactType(contact.contact_type || "");

                    const emailMethod = contact.methods?.find(
                      (method) => method.method_type === "email"
                    );

                    const phoneMethod = contact.methods?.find(
                      (method) => method.method_type === "phone"
                    );

                    setContactEmail(emailMethod?.value || "");
                    setContactPhone(phoneMethod?.value || "");
                    setShowContactForm(true);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => deletePropertyContact(contact.id)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {contact.methods?.length > 0 && (
              <div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-2">
                {contact.methods.map((method) => (
                  <div
                    key={method.id}
                    className="rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                      {method.label}
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {method.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {contact.notes && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {contact.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
      </div>
  </div>
</div>
)}
{activeTab === "Assets" && (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 px-8 py-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4 7 8 4 8-4M12 11v10"
                />
              </svg>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Property Equipment
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                Assets
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
            Equipment and systems associated with this property.
          </p>
        </div>

        <button
          onClick={() => setShowAssetForm(!showAssetForm)}
          className="inline-flex items-center justify-center rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163B5C]"
        >
          {showAssetForm ? "Cancel" : "Add Asset"}
        </button>
      </div>
    </div>

    {showAssetForm && (
      <div className="border-b border-gray-200 bg-gray-50/70 px-8 py-7">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900">
              Add New Asset
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add equipment or systems associated with this property.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Asset Name
              </label>

              <input
                placeholder="e.g. HVAC System"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Asset Type
              </label>

              <input
                placeholder="e.g. HVAC, Pool, Appliance"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Manufacturer
              </label>

              <input
                placeholder="Manufacturer name"
                value={assetManufacturer}
                onChange={(e) => setAssetManufacturer(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Model
              </label>

              <input
                placeholder="Model number"
                value={assetModel}
                onChange={(e) => setAssetModel(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Serial Number
              </label>

              <input
                placeholder="Serial number"
                value={assetSerialNumber}
                onChange={(e) => setAssetSerialNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Install Date
              </label>

              <input
                type="date"
                value={assetInstallDate}
                onChange={(e) => setAssetInstallDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                placeholder="Add any useful maintenance or equipment notes"
                value={assetNotes}
                onChange={(e) => setAssetNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                rows={4}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={addAsset}
              className="rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163B5C]"
            >
              Save Asset
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="p-8">
      {assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4 7 8 4 8-4M12 11v10"
              />
            </svg>
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-800">
            No assets added yet
          </p>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
            Add HVAC systems, pool equipment, appliances, or other property
            assets to keep important equipment information in one place.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                    Asset
                  </p>

                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                    {asset.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {asset.asset_type || "Asset type not provided"}
                  </p>
                </div>

                <div className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">
                  {asset.status || "Status not provided"}
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Manufacturer
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {asset.manufacturer || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Model
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {asset.model || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Serial Number
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {asset.serial_number || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Install Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {asset.install_date || "Not provided"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Notes
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {asset.notes || "No notes"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}


{activeTab === "Work Orders" && (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    {/* Header */}
    <div className="border-b border-gray-200 px-8 py-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 11 2 2 4-4M9 17h6"
                />
              </svg>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Property Maintenance
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                Work Orders
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
            Schedule, assign, track, and manage maintenance work for this
            property.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowWorkOrderForm(!showWorkOrderForm)}
          className="inline-flex items-center justify-center rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163B5C]"
        >
          {showWorkOrderForm ? "Cancel" : "Add Work Order"}
        </button>
      </div>
    </div>

    {/* Calendar */}
    <div className="border-b border-gray-200 bg-gray-50/50 px-8 py-7">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              setCalendarDate(
                new Date(
                  calendarDate.getFullYear(),
                  calendarDate.getMonth() - 1,
                  1
                )
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Previous
          </button>

          <div className="text-center">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900">
              {formatCalendarMonth(calendarDate)}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Scheduled property work
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setCalendarDate(
                new Date(
                  calendarDate.getFullYear(),
                  calendarDate.getMonth() + 1,
                  1
                )
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Next →
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="mt-0 grid grid-cols-7 border-l border-t border-gray-200">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    className="border-b border-r border-gray-200 bg-gray-50 p-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {day}
                  </div>
                )
              )}

              {getCalendarDays(calendarDate).map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[120px] border-b border-r border-gray-200 bg-gray-50"
                    />
                  );
                }

                const dateString = formatCalendarDate(day);

                const dayWorkOrders = workOrders.filter(
                  (workOrder) => workOrder.due_date === dateString
                );

                const isToday =
                  formatCalendarDate(new Date()) === dateString;

                return (
                  <div
                    key={dateString}
                    className={
                      "min-h-[120px] border-b border-r border-gray-200 p-2 " +
                      (isToday ? "bg-blue-50/60" : "bg-white")
                    }
                  >
                    <div
                      className={
                        "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold " +
                        (isToday
                          ? "bg-[#102A43] text-white"
                          : "text-gray-700")
                      }
                    >
                      {day.getDate()}
                    </div>

                    <div className="space-y-1.5">
                      {dayWorkOrders.map((workOrder) => {
                        const completed =
                          workOrder.status === "Completed";

                        const cancelled =
                          workOrder.status === "Cancelled";

                        return (
                          <Link
                            key={workOrder.id}
                            href={`/work-orders/${workOrder.id}`}
                            className={
                              "block rounded-lg px-2.5 py-2 text-xs font-semibold transition " +
                              (completed
                                ? "bg-gray-200 text-gray-500 line-through"
                                : cancelled
                                  ? "bg-gray-100 text-gray-400 line-through"
                                  : `${getTeamMemberColor(
                                      workOrder.assigned_user_id
                                    )} text-white hover:opacity-90`)
                            }
                          >
                            {workOrder.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 border-t border-gray-200 px-6 py-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-600" />
            <span className="text-gray-600">Scheduled / Active</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-gray-200" />
            <span className="text-gray-600">Completed</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-gray-100" />
            <span className="text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>
    </div>

    {/* Add / Edit Work Order Form */}
    {showWorkOrderForm && (
      <div className="border-b border-gray-200 bg-gray-50/70 px-8 py-7">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900">
              {editingWorkOrderId
                ? "Edit Work Order"
                : "Add New Work Order"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Enter the maintenance details and assign the work to a team
              member.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Work Order Title
              </label>

              <input
                placeholder="e.g. Pool equipment inspection"
                value={workOrderTitle}
                onChange={(e) => setWorkOrderTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                placeholder="Describe the maintenance request..."
                value={workOrderDescription}
                onChange={(e) =>
                  setWorkOrderDescription(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                rows={4}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Priority
              </label>

              <select
                value={workOrderPriority}
                onChange={(e) =>
                  setWorkOrderPriority(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Due Date
              </label>

              <input
                type="date"
                value={workOrderDueDate}
                onChange={(e) =>
                  setWorkOrderDueDate(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={workOrderStatus}
                onChange={(e) =>
                  setWorkOrderStatus(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assigned To
              </label>

              <select
                value={workOrderAssignedUserId}
                onChange={(e) =>
                  setWorkOrderAssignedUserId(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Unassigned</option>

                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name || "Unnamed Team Member"}
                    {member.role ? ` — ${member.role}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Estimated Cost
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={workOrderEstimatedCost}
                onChange={(e) =>
                  setWorkOrderEstimatedCost(e.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Actual Cost
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={workOrderActualCost}
                onChange={(e) =>
                  setWorkOrderActualCost(e.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Completion Notes
              </label>

              <textarea
                value={workOrderCompletionNotes}
                onChange={(e) =>
                  setWorkOrderCompletionNotes(e.target.value)
                }
                placeholder="Describe the work completed..."
                rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addWorkOrder}
              className="rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163B5C]"
            >
              {editingWorkOrderId
                ? "Save Changes"
                : "Save Work Order"}
            </button>

            {editingWorkOrderId && (
              <button
                type="button"
                onClick={deleteWorkOrder}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Delete Work Order
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Work Order List */}
    <div className="p-8">
      {workOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
              />
            </svg>
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-800">
            No work orders yet
          </p>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
            Add a work order to begin tracking maintenance and service
            activity for this property.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {workOrders.map((workOrder) => {
            const completed =
              workOrder.status === "Completed";

            const cancelled =
              workOrder.status === "Cancelled";

            return (
              <div
                key={workOrder.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                        Work Order
                      </p>

                      <span
                        className={
                          "rounded-full px-2.5 py-1 text-xs font-semibold " +
                          (completed
                            ? "bg-gray-100 text-gray-600"
                            : cancelled
                              ? "bg-gray-100 text-gray-500"
                              : "bg-blue-50 text-blue-700")
                        }
                      >
                        {workOrder.status}
                      </span>
                    </div>

                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">
                      {workOrder.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/work-orders/${workOrder.id}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      View Work Order
                    </Link>

                    <button
                      type="button"
                      onClick={() => editWorkOrder(workOrder)}
                      className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {workOrder.description && (
                  <p className="mt-5 text-sm leading-6 text-gray-600">
                    {workOrder.description}
                  </p>
                )}

                <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                      Assigned To
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {workOrder.assigned_user?.full_name ||
                        "Unassigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                      Priority
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {workOrder.priority}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                      Due Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {workOrder.due_date || "Not scheduled"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                      Costs
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {workOrder.actual_cost !== null &&
                      workOrder.actual_cost !== undefined
                        ? `$${Number(workOrder.actual_cost).toFixed(2)} actual`
                        : workOrder.estimated_cost !== null &&
                            workOrder.estimated_cost !== undefined
                          ? `$${Number(
                              workOrder.estimated_cost
                            ).toFixed(2)} estimated`
                          : "No cost recorded"}
                    </p>
                  </div>
                </div>

                {workOrder.completion_notes && (
                  <div className="mt-5 rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                      Completion Notes
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {workOrder.completion_notes}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <select
                    value={workOrder.status}
                    onChange={(e) =>
                      updateWorkOrderStatus(
                        workOrder.id,
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {workOrder.estimated_cost !== null &&
                      workOrder.estimated_cost !== undefined && (
                        <span>
                          Estimated: $
                          {Number(
                            workOrder.estimated_cost
                          ).toFixed(2)}
                        </span>
                      )}

                    {workOrder.actual_cost !== null &&
                      workOrder.actual_cost !== undefined && (
                        <span>
                          Actual: $
                          {Number(
                            workOrder.actual_cost
                          ).toFixed(2)}
                        </span>
                      )}

                    {workOrder.estimated_cost !== null &&
                      workOrder.estimated_cost !== undefined &&
                      workOrder.actual_cost !== null &&
                      workOrder.actual_cost !== undefined && (
                        <span className="font-semibold text-gray-600">
                          {Number(workOrder.actual_cost) <=
                          Number(workOrder.estimated_cost)
                            ? `$${(
                                Number(
                                  workOrder.estimated_cost
                                ) -
                                Number(
                                  workOrder.actual_cost
                                )
                              ).toFixed(2)} Under Estimate`
                            : `$${(
                                Number(
                                  workOrder.actual_cost
                                ) -
                                Number(
                                  workOrder.estimated_cost
                                )
                              ).toFixed(2)} Over Estimate`}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}


{activeTab === "Service History" && (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 px-8 py-7">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 3h8l3 3v15H5V3h3Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 3v5h8V3M8 12h8M8 16h5"
            />
          </svg>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            Property Records
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
            Service History
          </h2>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
        Review maintenance and service activity associated with this
        property.
      </p>
    </div>

    <div className="p-8">
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 3h8l3 3v15H5V3h3Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 3v5h8V3M8 12h8M8 16h5"
            />
          </svg>
        </div>

        <p className="mt-4 text-sm font-semibold text-gray-800">
          No service history yet
        </p>

        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
          Completed maintenance and service activity will appear here as
          work is performed on this property.
        </p>
      </div>
    </div>
  </div>
)}

</div>
  </AppLayout>
  );
}
