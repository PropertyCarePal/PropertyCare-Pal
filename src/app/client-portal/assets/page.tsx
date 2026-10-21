
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import ClientSidebar from "@/components/ClientSidebar";

type Asset = {
  id: string;
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

export default function ClientAssetsPage() {
  const { user, loading: authLoading } = useAuth();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    async function loadAssets() {
      try {
        setLoading(true);
        setErrorMessage("");

        // Get the properties assigned to this client.
        const { data: clientProperties, error: clientPropertiesError } =
          await supabase
            .from("client_properties")
            .select("property_id")
            .eq("profile_id", user.id);

        if (clientPropertiesError) {
          console.error(
            "CLIENT PROPERTIES ERROR:",
            clientPropertiesError
          );
          setErrorMessage("Unable to load your properties.");
          return;
        }

        const propertyIds =
          clientProperties?.map((item) => item.property_id) ?? [];

        if (propertyIds.length === 0) {
          setAssets([]);
          return;
        }

        // Get the assets belonging to those properties.
        const { data: assetData, error: assetError } = await supabase
          .from("assets")
          .select(
            `
              id,
              property_id,
              name,
              asset_type,
              manufacturer,
              model,
              serial_number,
              install_date,
              status,
              notes
            `
          )
          .in("property_id", propertyIds)
          .order("name", { ascending: true });

        if (assetError) {
          console.error("ASSETS ERROR:", assetError);
          setErrorMessage("Unable to load your assets.");
          return;
        }

        // Get property names.
        const { data: properties, error: propertiesError } = await supabase
          .from("properties")
          .select("id, name")
          .in("id", propertyIds);

        if (propertiesError) {
          console.error("PROPERTY NAMES ERROR:", propertiesError);
        }

        const propertyMap = new Map(
          (properties ?? []).map((property) => [property.id, property.name])
        );

        const formattedAssets: Asset[] = (assetData ?? []).map((asset) => ({
          ...asset,
          property_name: propertyMap.get(asset.property_id) ?? "Property",
        }));

        setAssets(formattedAssets);
      } catch (error) {
        console.error("LOAD CLIENT ASSETS ERROR:", error);
        setErrorMessage("Unable to load your assets.");
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [user, authLoading]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ClientSidebar />

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Assets
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View the equipment and assets associated with your property.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                Loading your assets...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-700">
                {errorMessage}
              </p>
            </div>
          ) : assets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7 text-blue-600"
                >
                  <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                  <path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21" />
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                No Assets Found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                There are currently no assets assigned to your property.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
              <Link
              key={asset.id}
              href={`/client-portal/assets/${asset.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
            >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-6 w-6 text-blue-600"
                        >
                          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                          <path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-900">
                          {asset.name}
                        </h2>

                        <p className="truncate text-sm text-slate-500">
                          {asset.property_name}
                        </p>
                      </div>
                    </div>

             {asset.status && (
  <span
    className={
      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
      (asset.status.toLowerCase() === "active"
        ? "bg-green-50 text-green-700"
        : "bg-slate-100 text-slate-600")
    }
  >
                        {asset.status}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-5">
                    {asset.asset_type && (
                      <div className="flex justify-between gap-4">
                        <span className="text-sm text-slate-500">
                          Type
                        </span>
                        <span className="text-right text-sm font-medium text-slate-900">
                          {asset.asset_type}
                        </span>
                      </div>
                    )}

                    {asset.manufacturer && (
                      <div className="flex justify-between gap-4">
                        <span className="text-sm text-slate-500">
                          Manufacturer
                        </span>
                        <span className="text-right text-sm font-medium text-slate-900">
                          {asset.manufacturer}
                        </span>
                      </div>
                    )}

                    {asset.model && (
                      <div className="flex justify-between gap-4">
                        <span className="text-sm text-slate-500">
                          Model
                        </span>
                        <span className="text-right text-sm font-medium text-slate-900">
                          {asset.model}
                        </span>
                      </div>
                    )}

                    {asset.serial_number && (
                      <div className="flex justify-between gap-4">
                        <span className="text-sm text-slate-500">
                          Serial Number
                        </span>
                        <span className="break-all text-right text-sm font-medium text-slate-900">
                          {asset.serial_number}
                        </span>
                      </div>
                    )}

        {asset.install_date && (
  <div className="flex justify-between gap-4">
    <span className="text-sm text-slate-500">
      Install Date
    </span>
    <span className="text-right text-sm font-medium text-slate-900">
      {new Date(
        asset.install_date + "T00:00:00"
      ).toLocaleDateString()}
    </span>
  </div>
)}
                  </div>

                  {asset.notes && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Notes
                      </p>

                      <p className="text-sm leading-6 text-slate-600">
                        {asset.notes}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

