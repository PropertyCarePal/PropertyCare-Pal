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
      <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Properties
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your organization's properties.
        </p>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-6 rounded-lg bg-gray-900 px-5 py-3 text-white"
        >
          Add Property
        </button>
      </header>

      {showForm && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Add New Property
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              placeholder="Property Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              placeholder="Property Type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="rounded-lg border p-3"
            />
          </div>

          <button
            onClick={addProperty}
            disabled={saving}
            className="mt-5 rounded-lg bg-emerald-600 px-5 py-3 text-white"
          >
            {saving ? "Saving..." : "Save Property"}
          </button>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-600">
            No properties added yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="block rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold">
                {property.name}
              </h2>

              <p className="mt-2 text-gray-600">
                {property.address}
              </p>

              <p className="text-gray-500">
                {property.city}, {property.state}
              </p>

              <p className="mt-4 text-sm">
                Status: {property.status}
              </p>

              <p className="text-sm">
                Type: {property.property_type}
              </p>
            </Link>
          ))}
        </div>
           )}
           </div>
         </AppLayout>
   );
 }