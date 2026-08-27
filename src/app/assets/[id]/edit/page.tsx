"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

type Asset = {
  id: string;
  organization_id: string;
  property_id: string;
  name: string;
  asset_type: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  install_date: string | null;
  status: string | null;
  notes: string | null;
};

type Property = {
  id: string;
  name: string;
};

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingAsset, setLoadingAsset] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetPropertyId, setAssetPropertyId] = useState("");
  const [assetManufacturer, setAssetManufacturer] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [assetSerialNumber, setAssetSerialNumber] = useState("");
  const [assetInstallDate, setAssetInstallDate] = useState("");
  const [assetStatus, setAssetStatus] = useState("Active");
  const [assetNotes, setAssetNotes] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadData() {
      if (!user || !params.id) return;

      setLoadingAsset(true);

      try {
        const { data: assetData, error: assetError } = await supabase
          .from("assets")
          .select("*")
          .eq("id", String(params.id))
          .single();

        if (assetError || !assetData) {
          console.error("ASSET EDIT LOAD ERROR:", assetError);
          setAsset(null);
          return;
        }

        setAsset(assetData);

        setAssetName(assetData.name || "");
        setAssetType(assetData.asset_type || "");
        setAssetPropertyId(assetData.property_id || "");
        setAssetManufacturer(assetData.manufacturer || "");
        setAssetModel(assetData.model || "");
        setAssetSerialNumber(assetData.serial_number || "");
        setAssetInstallDate(assetData.install_date || "");
        setAssetStatus(assetData.status || "Active");
        setAssetNotes(assetData.notes || "");

        const { data: propertyData, error: propertyError } =
          await supabase
            .from("properties")
            .select("id, name")
            .order("name");

        if (propertyError) {
          console.error("PROPERTY LOAD ERROR:", propertyError);
        } else {
          setProperties(propertyData || []);
        }
      } finally {
        setLoadingAsset(false);
      }
    }

    loadData();
  }, [user, params.id]);

  async function saveAsset() {
    if (!user || !asset) return;

    if (!assetName.trim()) {
      alert("Please enter an asset name.");
      return;
    }

    if (!assetPropertyId) {
      alert("Please select a property.");
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("assets")
        .update({
          property_id: assetPropertyId,
          name: assetName.trim(),
          asset_type: assetType || null,
          manufacturer: assetManufacturer || null,
          model: assetModel || null,
          serial_number: assetSerialNumber || null,
          install_date: assetInstallDate || null,
          status: assetStatus || "Active",
          notes: assetNotes || null,
        })
        .eq("id", asset.id)
        .select()
        .single();

      if (error) {
        console.error("ASSET EDIT SAVE ERROR:", error);
        alert(
          `Unable to save asset.\n\n${
            error.message || "Unknown Supabase error"
          }`
        );
        return;
      }

      if (!data) {
        alert("The asset could not be updated.");
        return;
      }

      alert("Asset updated successfully.");

      router.push(`/assets/${asset.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingAsset) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          Loading asset...
        </div>
      </AppLayout>
    );
  }

  if (!asset) {
    return (
      <AppLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Asset Not Found
          </h1>

          <Link
            href="/assets"
            className="mt-4 inline-block text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            ← Back to Assets
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href={`/assets/${asset.id}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to Asset
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Edit Asset
          </h1>

          <p className="mt-2 text-gray-600">
            Update the information for {asset.name}.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Asset Name
              </label>

              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                placeholder="Pool Pump"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Property
              </label>

              <select
                value={assetPropertyId}
                onChange={(e) => setAssetPropertyId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="">Select property</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Asset Type
              </label>

              <input
                type="text"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                placeholder="Pool Equipment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Manufacturer
              </label>

              <input
                type="text"
                value={assetManufacturer}
                onChange={(e) =>
                  setAssetManufacturer(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Model
              </label>

              <input
                type="text"
                value={assetModel}
                onChange={(e) => setAssetModel(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Serial Number
              </label>

              <input
                type="text"
                value={assetSerialNumber}
                onChange={(e) =>
                  setAssetSerialNumber(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Install Date
              </label>

              <input
                type="date"
                value={assetInstallDate}
                onChange={(e) =>
                  setAssetInstallDate(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={assetStatus}
                onChange={(e) => setAssetStatus(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                value={assetNotes}
                onChange={(e) => setAssetNotes(e.target.value)}
                rows={5}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                placeholder="Additional notes about this asset..."
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              href={`/assets/${asset.id}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={saveAsset}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}