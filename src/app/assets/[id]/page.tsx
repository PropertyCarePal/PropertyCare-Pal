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

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadAsset() {
      if (!user || !params.id) return;

      setLoadingAsset(true);

      try {
        const { data: assetData, error: assetError } = await supabase
          .from("assets")
          .select("*")
          .eq("id", String(params.id))
          .single();

        if (assetError) {
          console.error("ASSET DETAIL LOAD ERROR:", assetError);
          setAsset(null);
          return;
        }

        setAsset(assetData);

        if (assetData.property_id) {
          const { data: propertyData, error: propertyError } =
            await supabase
              .from("properties")
              .select("id, name")
              .eq("id", assetData.property_id)
              .single();

          if (propertyError) {
            console.error(
              "PROPERTY DETAIL LOAD ERROR:",
              propertyError
            );
          } else {
            setProperty(propertyData);
          }
        }
      } finally {
        setLoadingAsset(false);
      }
    }

    loadAsset();
  }, [user, params.id]);

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
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/assets"
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to Assets
          </Link>

          <div className="mt-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {asset.name}
              </h1>

              <p className="mt-2 text-gray-600">
                {property?.name || "Unknown Property"}
              </p>
            </div>

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
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Asset Information
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Property
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {property?.name || "Unknown Property"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Asset Type
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.asset_type || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Manufacturer
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.manufacturer || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Model
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.model || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Serial Number
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.serial_number || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Install Date
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.install_date || "Not provided"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">
                Notes
              </p>

              <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                {asset.notes || "No notes"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}