"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

type Asset = {
  id: string;
  organization_id: string;
  property_id: string;
  property_name?: string;
  name: string;
  asset_type: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  install_date: string | null;
  status: string | null;
  notes: string | null;
};

export default function AssetsPage() {
  const { user, loading } = useAuth();
 
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [properties, setProperties] = useState<
  { id: string; name: string }[]
>([]);

const [showAssetForm, setShowAssetForm] = useState(false);

const [assetName, setAssetName] = useState("");
const [assetType, setAssetType] = useState("");
const [assetPropertyId, setAssetPropertyId] = useState("");
const [assetManufacturer, setAssetManufacturer] = useState("");
const [assetModel, setAssetModel] = useState("");
const [assetSerialNumber, setAssetSerialNumber] = useState("");
const [assetInstallDate, setAssetInstallDate] = useState("");
const [assetStatus, setAssetStatus] = useState("Active");
const [assetNotes, setAssetNotes] = useState("");
const [savingAsset, setSavingAsset] = useState(false); 
const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
async function addAsset() {
    if (!user) return;
  
    if (!assetName.trim()) {
      alert("Please enter an asset name.");
      return;
    }
  
    if (!assetPropertyId) {
      alert("Please select a property.");
      return;
    }
  
    setSavingAsset(true);
  
    try {
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
        .from("assets")
        .insert({
          organization_id: profile.organization_id,
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
        .select()
        .single();
  
        if (error) {
            console.error("ASSET UPDATE ERROR:", JSON.stringify(error, null, 2));
            console.error("ASSET UPDATE ERROR MESSAGE:", error.message);
            console.error("ASSET UPDATE ERROR DETAILS:", error.details);
            console.error("ASSET UPDATE ERROR HINT:", error.hint);
          
            alert(
              `Unable to update asset.\n\n${
                error.message || "Unknown Supabase error"
              }`
            );
          
            return;
          }
  
      setAssets((current) =>
        [...current, data].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
  
      setAssetName("");
      setAssetType("");
      setAssetPropertyId("");
      setAssetManufacturer("");
      setAssetModel("");
      setAssetSerialNumber("");
      setAssetInstallDate("");
      setAssetStatus("Active");
      setAssetNotes("");
      setShowAssetForm(false);
  
      alert("Asset saved successfully.");
    } finally {
      setSavingAsset(false);
    }
  }
  async function updateAsset() {
    if (!user || !editingAssetId) return;
  
    if (!assetName.trim()) {
      alert("Please enter an asset name.");
      return;
    }
  
    if (!assetPropertyId) {
      alert("Please select a property.");
      return;
    }
  
    setSavingAsset(true);
  
    try {
        const { error } = await supabase
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
        .eq("id", editingAssetId);
  
        if (error) {
            console.error("ASSET UPDATE ERROR MESSAGE:", error.message);
            console.error("ASSET UPDATE ERROR DETAILS:", error.details);
            console.error("ASSET UPDATE ERROR HINT:", error.hint);
            console.error("ASSET UPDATE ERROR CODE:", error.code);
            console.error("ASSET UPDATE ERROR OBJECT:", error);
          
            alert(
              `Unable to update asset.\n\n${
                error.message || "Unknown Supabase error"
              }`
            );
          
            return;
          }
          const selectedProperty = properties.find(
            (property) => property.id === assetPropertyId
          );
          const updatedAsset: Asset = {
            id: editingAssetId,
            organization_id: assets.find(
              (asset) => asset.id === editingAssetId
            )?.organization_id || "",
            property_id: assetPropertyId,
            property_name: selectedProperty?.name || "Unknown Property",
            name: assetName.trim(),
            asset_type: assetType || null,
            manufacturer: assetManufacturer || null,
            model: assetModel || null,
            serial_number: assetSerialNumber || null,
            install_date: assetInstallDate || null,
            status: assetStatus || "Active",
            notes: assetNotes || null,
          };
      setAssets((current) =>
        current
          .map((asset) =>
            asset.id === editingAssetId ? updatedAsset : asset
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
  
      setEditingAssetId(null);
      setShowAssetForm(false);
  
      setAssetName("");
      setAssetType("");
      setAssetPropertyId("");
      setAssetManufacturer("");
      setAssetModel("");
      setAssetSerialNumber("");
      setAssetInstallDate("");
      setAssetStatus("Active");
      setAssetNotes("");
  
      alert("Asset updated successfully.");
    } finally {
      setSavingAsset(false);
    }
  }

  useEffect(() => {
    async function loadAssets() {
      if (!user) {
        setLoadingAssets(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("PROFILE ERROR:", profileError);
        setLoadingAssets(false);
        return;
      }
      const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("id, name")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true });
    
    if (propertyError) {
      console.error("PROPERTY LOAD ERROR:", propertyError);
    } else {
      setProperties(propertyData || []);
    }
    const { data, error } = await supabase
    .from("assets")
    .select(`
      *,
      properties (
        name
      )
    `)
    .eq("organization_id", profile.organization_id)
    .order("name", { ascending: true }); 

    if (error) {
        console.error("ASSET LOAD ERROR:", error);
      } else {
        console.log("ASSETS LOADED:", data);
      
        const formattedAssets = (data || []).map((asset: any) => ({
          ...asset,
          property_name: asset.properties?.name || "Unknown Property",
        }));
      
        setAssets(formattedAssets);
      }

      setLoadingAssets(false);
    }

    if (!loading) {
      loadAssets();
    }
  }, [user, loading]);

  if (loading || loadingAssets) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading assets...
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">
      Assets
    </h1>

    <p className="mt-2 text-gray-600">
      Manage property equipment, systems, and other assets.
    </p>
  </div>

  <button
    type="button"
    onClick={() => setShowAssetForm(true)}
    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
  >
    + Add Asset
  </button>
</div>
{showAssetForm && (
  <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-gray-900">
  {editingAssetId ? "Edit Asset" : "Add Asset"}
</h2>

    <div className="mt-6 grid gap-4 md:grid-cols-2">

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Asset Name
        </label>
        <input
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Pool Pump"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Asset Type
        </label>
        <input
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Pool Equipment"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Property
        </label>
        <select
          value={assetPropertyId}
          onChange={(e) => setAssetPropertyId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
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
          Manufacturer
        </label>
        <input
          value={assetManufacturer}
          onChange={(e) => setAssetManufacturer(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Pentair"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Model
        </label>
        <input
          value={assetModel}
          onChange={(e) => setAssetModel(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="VS 300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Serial Number
        </label>
        <input
          value={assetSerialNumber}
          onChange={(e) => setAssetSerialNumber(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="SN 400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Install Date
        </label>
        <input
          type="date"
          value={assetInstallDate}
          onChange={(e) => setAssetInstallDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          value={assetStatus}
          onChange={(e) => setAssetStatus(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
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
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          placeholder="Additional information about this asset..."
        />
      </div>

    </div>

    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={() => setShowAssetForm(false)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={editingAssetId ? updateAsset : addAsset}
        disabled={savingAsset}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {savingAsset ? "Saving..." : editingAssetId ? "Save Changes" : "Save Asset"}
      </button>
    </div>
  </div>
)}
        {assets.length === 0 ? (
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <p className="text-gray-500">
              No assets have been added yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Asset
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Manufacturer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Model
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
  Actions
</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
  <Link
    href={`/assets/${asset.id}`}
    className="font-medium text-gray-900 hover:text-gray-600"
  >
    {asset.name}
  </Link>

  <p className="mt-1 text-sm text-gray-500">
    Property: {asset.property_name || "Unknown Property"}
  </p> 

                        {asset.serial_number && (
                          <p className="mt-1 text-xs text-gray-500">
                            Serial: {asset.serial_number}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
  <button
    type="button"
    onClick={() => {
      setEditingAssetId(asset.id);
      setAssetName(asset.name);
      setAssetType(asset.asset_type || "");
      setAssetPropertyId(asset.property_id);
      setAssetManufacturer(asset.manufacturer || "");
      setAssetModel(asset.model || "");
      setAssetSerialNumber(asset.serial_number || "");
      setAssetInstallDate(asset.install_date || "");
      setAssetStatus(asset.status || "Active");
      setAssetNotes(asset.notes || "");
      setShowAssetForm(true);
    }}
    className="text-sm font-medium text-gray-700 hover:text-gray-900"
  >
    Edit
  </button>
</td>

                      <td className="px-6 py-4">
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
      asset.status === "Active"
        ? "bg-green-100 text-green-700"
        : asset.status === "Needs Repair"
        ? "bg-yellow-100 text-yellow-700"
        : asset.status === "Retired"
        ? "bg-gray-200 text-gray-700"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    {asset.status || "Not set"}
  </span>
</td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {asset.manufacturer || "Not provided"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {asset.model || "Not provided"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {asset.status || "Not set"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}