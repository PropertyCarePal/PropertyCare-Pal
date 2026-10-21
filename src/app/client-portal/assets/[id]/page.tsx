"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ClientSidebar from "@/components/ClientSidebar";
import { supabase } from "@/lib/supabase";

type Asset = {
  id: string;
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

type ServiceRecord = {
  id: string;
  asset_id: string;
  service_date: string;
  technician_name: string | null;
  service_company: string | null;
  service_description: string | null;
  service_notes: string | null;
};

type AssetDocument = {
  id: string;
  asset_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  document_type: string;
  description: string | null;
  created_at: string;
};

export default function ClientAssetDetailsPage() {
  const params = useParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    async function loadAsset() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view this asset.");
          return;
        }

        const { data: clientProperties, error: clientPropertiesError } =
          await supabase
            .from("client_properties")
            .select("property_id")
            .eq("profile_id", user.id);

        if (clientPropertiesError) {
          throw clientPropertiesError;
        }

        const propertyIds =
          clientProperties?.map((item) => item.property_id) ?? [];

        if (propertyIds.length === 0) {
          setError("No property has been assigned to your account.");
          return;
        }

        const { data: assetData, error: assetError } = await supabase
          .from("assets")
          .select(
            "id, property_id, name, asset_type, manufacturer, model, serial_number, install_date, status, notes"
          )
          .eq("id", assetId)
          .in("property_id", propertyIds)
          .maybeSingle();

        if (assetError) {
          throw assetError;
        }

        if (!assetData) {
          setError("Asset not found.");
          return;
        }

        setAsset(assetData);

        const { data: serviceData, error: serviceError } = await supabase
          .from("asset_service_history")
          .select(
            "id, asset_id, service_date, technician_name, service_company, service_description, service_notes"
          )
          .eq("asset_id", assetData.id)
          .order("service_date", { ascending: false });

        if (serviceError) {
          throw serviceError;
        }

        setServiceHistory(serviceData ?? []);

        setLoadingDocuments(true);
        setDocumentError("");

        const { data: documentData, error: documentQueryError } =
          await supabase
            .from("asset_documents")
            .select(
              "id, asset_id, file_name, file_type, file_size, storage_path, document_type, description, created_at"
            )
            .eq("asset_id", assetData.id)
            .order("created_at", { ascending: false });

        if (documentQueryError) {
          throw documentQueryError;
        }

        setDocuments(documentData ?? []);
      } catch (err) {
        console.error("Error loading asset:", err);
        setError("Unable to load this asset.");
      } finally {
        setLoadingDocuments(false);
        setLoading(false);
      }
    }

    if (assetId) {
      loadAsset();
    }
  }, [assetId]);

  async function handleViewDocument(document: AssetDocument) {
    try {
      setDocumentError("");

      const { data, error } = await supabase.storage
        .from("asset-documents")
        .createSignedUrl(document.storage_path, 60 * 10);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to create document URL.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error opening document:", err);
      setDocumentError("Unable to open this document.");
    }
  }

  function formatFileSize(size: number | null) {
    if (!size) {
      return "";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <ClientSidebar />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm text-gray-500">Loading asset...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <ClientSidebar />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/client-portal/assets"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Back to Assets
            </Link>

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-700">
                {error || "Asset not found."}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/client-portal/assets"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Assets
          </Link>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {asset.name}
            </h1>

            {asset.asset_type && (
              <p className="mt-1 text-sm text-gray-500">
                {asset.asset_type}
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-white shadow-sm">
            <div className="border-b p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Asset Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Equipment information for this property asset.
                  </p>
                </div>

                {asset.status && (
                  <span
                    className={
                      "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
                      (asset.status.toLowerCase() === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600")
                    }
                  >
                    {asset.status}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              {asset.manufacturer && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Manufacturer
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {asset.manufacturer}
                  </p>
                </div>
              )}

              {asset.model && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Model
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {asset.model}
                  </p>
                </div>
              )}

              {asset.serial_number && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Serial Number
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-gray-900">
                    {asset.serial_number}
                  </p>
                </div>
              )}

              {asset.install_date && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Install Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {new Date(
                      asset.install_date + "T00:00:00"
                    ).toLocaleDateString("en-US")}
                  </p>
                </div>
              )}
            </div>

            {asset.notes && (
              <div className="border-t border-gray-100 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {asset.notes}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-xl font-bold text-gray-900">
                Documents & Manuals
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manuals, warranties, reports, and other documents for this
                asset.
              </p>
            </div>

            <div className="p-6">
              {documentError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{documentError}</p>
                </div>
              )}

              {loadingDocuments ? (
                <p className="text-sm text-gray-500">
                  Loading documents...
                </p>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No documents have been added yet.
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Documents and manuals will appear here when they are
                    uploaded by your property management team.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-all text-sm font-semibold text-gray-900">
                              {document.file_name}
                            </p>

                            {document.document_type && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                {document.document_type}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            {document.file_size && (
                              <span>
                                {formatFileSize(document.file_size)}
                              </span>
                            )}

                            {document.created_at && (
                              <span>
                                Added{" "}
                                {new Date(
                                  document.created_at
                                ).toLocaleDateString("en-US")}
                              </span>
                            )}
                          </div>

                          {document.description && (
                            <p className="mt-3 text-sm leading-6 text-gray-600">
                              {document.description}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleViewDocument(document)}
                          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          View Document
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-xl font-bold text-gray-900">
                Service History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                A record of service performed on this asset.
              </p>
            </div>

            <div className="p-6">
              {serviceHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No service history has been recorded yet.
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Service records will appear here when they are added.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {serviceHistory.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col justify-between gap-3 md:flex-row">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {service.service_description ||
                              "Service performed"}
                          </p>

                          {service.service_company && (
                            <p className="mt-1 text-sm text-gray-600">
                              {service.service_company}
                            </p>
                          )}
                        </div>

                        <div className="text-sm font-medium text-gray-700">
                          {new Date(
                            service.service_date + "T00:00:00"
                          ).toLocaleDateString("en-US")}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 md:grid-cols-2">
                        {service.technician_name && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Technician
                            </p>

                            <p className="mt-1 text-sm text-gray-900">
                              {service.technician_name}
                            </p>
                          </div>
                        )}

                        {service.service_company && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Service Company
                            </p>

                            <p className="mt-1 text-sm text-gray-900">
                              {service.service_company}
                            </p>
                          </div>
                        )}
                      </div>

                      {service.service_notes && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Service Notes
                          </p>

                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {service.service_notes}
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
      </main>
    </div>
  );
}