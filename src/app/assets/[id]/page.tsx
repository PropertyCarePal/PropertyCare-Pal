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

const documentTypes = [
  "User Manual",
  "Installation Manual",
  "Service Manual",
  "Warranty",
  "Maintenance Instructions",
  "Inspection Report",
  "Photo",
  "Other",
];

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);

  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [loadingServiceHistory, setLoadingServiceHistory] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [savingServiceRecord, setSavingServiceRecord] = useState(false);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(
    null
  );

  const [serviceDate, setServiceDate] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [serviceCompany, setServiceCompany] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentType, setDocumentType] = useState("User Manual");
  const [documentDescription, setDocumentDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  function clearServiceForm() {
    setServiceDate("");
    setTechnicianName("");
    setServiceCompany("");
    setServiceDescription("");
    setServiceNotes("");
    setEditingServiceId(null);
  }

  function handleCancelServiceForm() {
    clearServiceForm();
    setShowServiceForm(false);
  }

  function handleEditServiceRecord(service: ServiceRecord) {
    setEditingServiceId(service.id);
    setServiceDate(service.service_date || "");
    setTechnicianName(service.technician_name || "");
    setServiceCompany(service.service_company || "");
    setServiceDescription(service.service_description || "");
    setServiceNotes(service.service_notes || "");
    setShowServiceForm(true);
  }

  async function handleSaveServiceRecord() {
    if (!asset) return;

    if (!serviceDate) {
      alert("Please enter a service date.");
      return;
    }

    if (!serviceDescription.trim()) {
      alert("Please enter a service description.");
      return;
    }

    setSavingServiceRecord(true);

    try {
      if (editingServiceId) {
        const { data: updatedServiceRecord, error } = await supabase
          .from("asset_service_history")
          .update({
            service_date: serviceDate,
            technician_name: technicianName.trim() || null,
            service_company: serviceCompany.trim() || null,
            service_description: serviceDescription.trim(),
            service_notes: serviceNotes.trim() || null,
          })
          .eq("id", editingServiceId)
          .select(
            "id, asset_id, service_date, technician_name, service_company, service_description, service_notes"
          )
          .single();

        if (error) {
          console.error("ASSET SERVICE RECORD UPDATE ERROR:", error);
          alert("Unable to update service record.");
          return;
        }

        setServiceHistory((currentHistory) =>
          currentHistory.map((service) =>
            service.id === editingServiceId
              ? updatedServiceRecord
              : service
          )
        );
      } else {
        const { data: newServiceRecord, error } = await supabase
          .from("asset_service_history")
          .insert({
            asset_id: asset.id,
            service_date: serviceDate,
            technician_name: technicianName.trim() || null,
            service_company: serviceCompany.trim() || null,
            service_description: serviceDescription.trim(),
            service_notes: serviceNotes.trim() || null,
          })
          .select(
            "id, asset_id, service_date, technician_name, service_company, service_description, service_notes"
          )
          .single();

        if (error) {
          console.error("ASSET SERVICE RECORD SAVE ERROR:", error);
          alert("Unable to save service record.");
          return;
        }

        setServiceHistory((currentHistory) => [
          newServiceRecord,
          ...currentHistory,
        ]);
      }

      clearServiceForm();
      setShowServiceForm(false);
    } finally {
      setSavingServiceRecord(false);
    }
  }

  async function handleDeleteServiceRecord(serviceId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service record?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(null);

    const { error } = await supabase
      .from("asset_service_history")
      .delete()
      .eq("id", serviceId);

    if (error) {
      console.error("ASSET SERVICE RECORD DELETE ERROR:", error);
      alert("Unable to delete service record.");
      return;
    }

    setServiceHistory((currentHistory) =>
      currentHistory.filter((service) => service.id !== serviceId)
    );
  }

  async function handleDeleteAsset() {
    if (!asset) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this asset?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", asset.id);

    if (error) {
      console.error("ASSET DELETE ERROR:", error);
      alert("Unable to delete asset.");
      return;
    }

    router.push("/assets");
  }

  async function loadDocuments(assetId: string) {
    setLoadingDocuments(true);

    const { data, error } = await supabase
      .from("asset_documents")
      .select(
        "id, asset_id, file_name, file_type, file_size, storage_path, document_type, description, created_at"
      )
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ASSET DOCUMENTS LOAD ERROR:", error);
      setDocuments([]);
    } else {
      setDocuments(data ?? []);
    }

    setLoadingDocuments(false);
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes || bytes <= 0) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function clearDocumentForm() {
    setSelectedFile(null);
    setDocumentType("User Manual");
    setDocumentDescription("");
  }

  async function handleUploadDocument() {
    if (!asset) return;

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    const maxFileSize = 25 * 1024 * 1024;

    if (selectedFile.size > maxFileSize) {
      alert("Files must be 25 MB or smaller.");
      return;
    }

    setUploadingDocument(true);

    try {
      const fileExtension = selectedFile.name.includes(".")
        ? selectedFile.name.split(".").pop()?.toLowerCase()
        : "";

      const safeFileName = selectedFile.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");

      const uniqueFileName = `${crypto.randomUUID()}-${safeFileName}`;

      const storagePath = `${asset.id}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("asset-documents")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type || undefined,
        });

      if (uploadError) {
        console.error("ASSET DOCUMENT UPLOAD ERROR:", uploadError);
        alert("Unable to upload document.");
        return;
      }

      const { data: documentData, error: documentError } = await supabase
        .from("asset_documents")
        .insert({
          asset_id: asset.id,
          file_name: selectedFile.name,
          file_type: selectedFile.type || fileExtension || null,
          file_size: selectedFile.size,
          storage_path: storagePath,
          document_type: documentType,
          description: documentDescription.trim() || null,
        })
        .select(
          "id, asset_id, file_name, file_type, file_size, storage_path, document_type, description, created_at"
        )
        .single();

      if (documentError) {
        console.error("ASSET DOCUMENT RECORD SAVE ERROR:", documentError);

        await supabase.storage
          .from("asset-documents")
          .remove([storagePath]);

        alert("Unable to save document information.");
        return;
      }

      setDocuments((currentDocuments) => [
        documentData,
        ...currentDocuments,
      ]);

      clearDocumentForm();
      setShowDocumentForm(false);
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handleViewDocument(document: AssetDocument) {
    const { data, error } = await supabase.storage
      .from("asset-documents")
      .createSignedUrl(document.storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      console.error("ASSET DOCUMENT VIEW ERROR:", error);
      alert("Unable to open document.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDeleteDocument(document: AssetDocument) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.file_name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(document.id);

    try {
      const { error: storageError } = await supabase.storage
        .from("asset-documents")
        .remove([document.storage_path]);

      if (storageError) {
        console.error(
          "ASSET DOCUMENT STORAGE DELETE ERROR:",
          storageError
        );
        alert("Unable to delete document file.");
        return;
      }

      const { error: documentError } = await supabase
        .from("asset_documents")
        .delete()
        .eq("id", document.id);

      if (documentError) {
        console.error(
          "ASSET DOCUMENT RECORD DELETE ERROR:",
          documentError
        );
        alert("The file was removed, but the document record could not be deleted.");
        return;
      }

      setDocuments((currentDocuments) =>
        currentDocuments.filter((item) => item.id !== document.id)
      );
    } finally {
      setDeletingDocumentId(null);
    }
  }

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

        const { data: serviceData, error: serviceError } =
          await supabase
            .from("asset_service_history")
            .select(
              "id, asset_id, service_date, technician_name, service_company, service_description, service_notes"
            )
            .eq("asset_id", assetData.id)
            .order("service_date", { ascending: false });

        if (serviceError) {
          console.error(
            "ASSET SERVICE HISTORY LOAD ERROR:",
            serviceError
          );
        } else {
          setServiceHistory(serviceData ?? []);
        }

        setLoadingServiceHistory(false);

        await loadDocuments(assetData.id);

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

            <div className="flex items-center gap-3">
              <Link
                href={`/assets/${asset.id}/edit`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </Link>

              <button
                type="button"
                onClick={handleDeleteAsset}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete Asset
              </button>

              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                {asset.status || "Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Asset Information
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Property</p>
              <p className="mt-1 font-medium text-gray-900">
                {property?.name || "Unknown Property"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Asset Type</p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.asset_type || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Manufacturer</p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.manufacturer || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Model</p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.model || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Serial Number</p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.serial_number || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Install Date</p>
              <p className="mt-1 font-medium text-gray-900">
                {asset.install_date || "Not provided"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Notes</p>

              <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                {asset.notes || "No notes"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Documents & Manuals
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manuals, warranties, instructions, reports, and other files
                for this asset.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearDocumentForm();
                setShowDocumentForm(true);
              }}
              className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b2033]"
            >
              Upload Document
            </button>
          </div>

          {showDocumentForm && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Upload Asset Document
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    clearDocumentForm();
                    setShowDocumentForm(false);
                  }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Document Type
                  </label>

                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    File
                  </label>

                  <input
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="mt-1 block w-full text-sm text-gray-700"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Maximum file size: 25 MB
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    value={documentDescription}
                    onChange={(e) =>
                      setDocumentDescription(e.target.value)
                    }
                    rows={3}
                    placeholder="Optional description..."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearDocumentForm();
                    setShowDocumentForm(false);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUploadDocument}
                  disabled={uploadingDocument}
                  className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingDocument ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            {loadingDocuments ? (
              <p className="text-sm text-gray-500">
                Loading documents...
              </p>
            ) : documents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No documents uploaded yet.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Upload manuals, warranties, instructions, or other files
                  for this asset.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-lg border border-gray-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
                          {document.file_type?.includes("pdf")
                            ? "PDF"
                            : "FILE"}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words font-semibold text-gray-900">
                            {document.file_name}
                          </h3>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                            <span>{document.document_type}</span>
                            <span>•</span>
                            <span>
                              {formatFileSize(document.file_size)}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(
                                document.created_at
                              ).toLocaleDateString("en-US")}
                            </span>
                          </div>

                          {document.description && (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDocument(document)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(document)}
                          disabled={deletingDocumentId === document.id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingDocumentId === document.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Service History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Service records for this asset.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearServiceForm();
                setShowServiceForm(true);
              }}
              className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b2033]"
            >
              Add Service Record
            </button>
          </div>

          {showServiceForm && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  {editingServiceId
                    ? "Edit Service Record"
                    : "Add Service Record"}
                </h3>

                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Date
                  </label>

                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Technician
                  </label>

                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="Technician name"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Company
                  </label>

                  <input
                    type="text"
                    value={serviceCompany}
                    onChange={(e) => setServiceCompany(e.target.value)}
                    placeholder="Company name"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Description
                  </label>

                  <input
                    type="text"
                    value={serviceDescription}
                    onChange={(e) =>
                      setServiceDescription(e.target.value)
                    }
                    placeholder="What service was performed?"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Service Notes
                  </label>

                  <textarea
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    rows={4}
                    placeholder="Additional notes about the service..."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveServiceRecord}
                  disabled={savingServiceRecord}
                  className="rounded-lg bg-[#102A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingServiceRecord
                    ? editingServiceId
                      ? "Updating..."
                      : "Saving..."
                    : editingServiceId
                      ? "Update Service Record"
                      : "Save Service Record"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            {loadingServiceHistory ? (
              <p className="text-sm text-gray-500">
                Loading service history...
              </p>
            ) : serviceHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No service history recorded yet.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add a service record when this asset is serviced.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceHistory.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-lg border border-gray-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {service.service_description ||
                            "Service performed"}
                        </h3>

                        {service.service_company && (
                          <p className="mt-1 text-sm text-gray-600">
                            {service.service_company}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(
                            service.service_date + "T00:00:00"
                          ).toLocaleDateString("en-US")}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            handleEditServiceRecord(service)
                          }
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteServiceRecord(service.id)
                          }
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
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

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
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
    </AppLayout>
  );
}