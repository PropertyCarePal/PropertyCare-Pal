"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

type Property = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  property_type: string | null;
};

export default function PropertiesPage() {
  const { user, loading } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [saving, setSaving] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  async function addProperty() {
    if (!user) return;

    setSaving(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("PROFILE ERROR:", profileError.message);
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("properties")
      .insert({
        organization_id: profile.organization_id,
        name,
        address,
        city,
        state,
        property_type: propertyType,
        status: "Active",
      });

    if (error) {
      alert(
        `INSERT ERROR:

${error.message}

DETAILS:
${error.details}

CODE:
${error.code}`
      );

      setSaving(false);
      return;
    }

    setName("");
    setAddress("");
    setCity("");
    setState("");
    setPropertyType("");
    setShowForm(false);
    setSaving(false);

    window.location.reload();
  }

  useEffect(() => {
    async function loadProperties() {
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError.message);
        setLoadingProperties(false);
        return;
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("organization_id", profile.organization_id);

      if (error) {
        console.error("PROPERTY ERROR:", error.message);
        setLoadingProperties(false);
        return;
      }

      setProperties(data || []);
      setLoadingProperties(false);
    }

    loadProperties();
  }, [user]);

  if (loading || loadingProperties) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading properties...
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Property Portfolio
              </p>
  
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#102A43]">
                Properties
              </h1>
  
              <p className="mt-2 text-base text-gray-500">
                Manage your organization's properties.
              </p>
            </div>
  
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="shrink-0 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md"
            >
              {showForm ? "Close Form" : "+ Add Property"}
            </button>
          </div>
        </header>
  
        {showForm && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Add New Property
              </h2>
  
              <p className="mt-1 text-sm text-gray-500">
                Add a property to your organization's portfolio.
              </p>
            </div>
  
            <div className="grid gap-4 md:grid-cols-2">
              <input
                placeholder="Property Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
  
              <input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
  
              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
  
              <input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
  
              <input
                placeholder="Property Type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
  
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={addProperty}
                disabled={saving}
                className="rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Property"}
              </button>
            </div>
          </div>
        )}
  
        {properties.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <span className="text-lg font-bold">P</span>
              </div>
  
              <div>
                <p className="font-semibold text-gray-900">
                  No properties added yet
                </p>
  
                <p className="mt-1 text-sm text-gray-500">
                  Add your first property to begin managing your portfolio.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
  <Link
    key={property.id}
    href={`/properties/${property.id}`}
    className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M9 21v-6h6v6" />
          </svg>
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-gray-900">
            {property.name}
          </h2>

          <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
            {property.property_type || "Property"}
          </p>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          property.status?.toLowerCase() === "active"
            ? "bg-green-50 text-green-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {property.status || "Active"}
      </span>
    </div>

    <div className="mt-6">
      <p className="text-sm font-medium text-gray-700">
        {property.address || "No address provided"}
      </p>

      <p className="mt-1 text-sm text-gray-500">
        {property.city || ""}
        {property.city && property.state ? ", " : ""}
        {property.state || ""}
      </p>
    </div>

    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
      <span className="text-sm font-medium text-gray-500">
        View property
      </span>

      <span className="text-sm font-semibold text-[#102A43] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-700">
        View →
      </span>
    </div>
  </Link>
))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}