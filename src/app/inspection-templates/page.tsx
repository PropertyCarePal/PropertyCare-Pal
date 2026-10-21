"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseClient } from "@/lib/supabase";

type TemplateItem = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type InspectionTemplate = {
  id: string;
  name: string;
  description: string | null;
  package_type: string | null;
  monthly_price: number | null;
  visits_per_month: number;
  is_active: boolean;
  inspection_template_items: TemplateItem[];
};

export default function InspectionTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [packageType, setPackageType] = useState("Home Check");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [visitsPerMonth, setVisitsPerMonth] = useState("1");

  const [items, setItems] = useState<TemplateItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("General");
  const [itemDescription, setItemDescription] = useState("");

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadTemplates();
    }
  }, [user, authLoading]);

  async function getOrganizationId() {
    if (!user) {
      throw new Error("You must be logged in.");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data?.organization_id) {
      throw new Error("Your account is not connected to an organization.");
    }

    return data.organization_id;
  }

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");

      const organizationId = await getOrganizationId();

      const { data, error } = await supabase
        .from("inspection_templates")
        .select(`
          id,
          name,
          description,
          package_type,
          monthly_price,
          visits_per_month,
          is_active,
          inspection_template_items (
            id,
            name,
            description,
            category,
            sort_order,
            is_active
          )
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const formattedTemplates: InspectionTemplate[] = (data || []).map(
        (template: any) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          package_type: template.package_type,
          monthly_price: template.monthly_price,
          visits_per_month: template.visits_per_month,
          is_active: template.is_active,
          inspection_template_items: (
            template.inspection_template_items || []
          )
            .filter((item: any) => item.is_active)
            .sort(
              (a: any, b: any) =>
                (a.sort_order || 0) - (b.sort_order || 0)
            )
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description || "",
              category: item.category || "General",
            })),
        })
      );

      setTemplates(formattedTemplates);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to load inspection packages.");
    } finally {
      setLoading(false);
    }
  }

  function addItem(event: FormEvent) {
    event.preventDefault();

    if (!itemName.trim()) {
      setError("Please enter an inspection item name.");
      return;
    }

    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      name: itemName.trim(),
      category: itemCategory.trim() || "General",
      description: itemDescription.trim(),
    };

    setItems((current) => [...current, newItem]);

    setItemName("");
    setItemCategory("General");
    setItemDescription("");
    setError("");
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function resetForm() {
    setName("");
    setPackageType("Home Check");
    setDescription("");
    setMonthlyPrice("");
    setVisitsPerMonth("1");
    setItems([]);

    setItemName("");
    setItemCategory("General");
    setItemDescription("");

    setEditingTemplateId(null);
  }

  function startEditTemplate(template: InspectionTemplate) {
    setEditingTemplateId(template.id);

    setName(template.name);
    setPackageType(template.package_type || "Home Check");
    setDescription(template.description || "");

    setMonthlyPrice(
      template.monthly_price !== null
        ? String(template.monthly_price)
        : ""
    );

    setVisitsPerMonth(String(template.visits_per_month));

    setItems(
      template.inspection_template_items.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        description: item.description,
        category: item.category,
      }))
    );

    setItemName("");
    setItemCategory("General");
    setItemDescription("");

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    resetForm();
    setMessage("");
    setError("");
  }

  async function saveTemplate(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!name.trim()) {
        throw new Error("Please enter a package name.");
      }

      const parsedVisits = Number(visitsPerMonth);

      if (!Number.isInteger(parsedVisits) || parsedVisits < 1) {
        throw new Error("Visits per month must be at least 1.");
      }

      let parsedPrice: number | null = null;

      if (monthlyPrice.trim() !== "") {
        parsedPrice = Number(monthlyPrice);

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          throw new Error(
            "Monthly price must be a valid positive number."
          );
        }
      }

      const organizationId = await getOrganizationId();

      if (editingTemplateId) {
        const { error: templateError } = await supabase
          .from("inspection_templates")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            package_type: packageType.trim() || null,
            monthly_price: parsedPrice,
            visits_per_month: parsedVisits,
          })
          .eq("id", editingTemplateId)
          .eq("organization_id", organizationId);

        if (templateError) {
          throw templateError;
        }

        const { error: deleteItemsError } = await supabase
          .from("inspection_template_items")
          .delete()
          .eq("template_id", editingTemplateId);

        if (deleteItemsError) {
          throw deleteItemsError;
        }

        if (items.length > 0) {
          const itemRows = items.map((item, index) => ({
            template_id: editingTemplateId,
            name: item.name,
            description: item.description || null,
            category: item.category || "General",
            sort_order: index,
            is_active: true,
          }));

          const { error: itemsError } = await supabase
            .from("inspection_template_items")
            .insert(itemRows);

          if (itemsError) {
            throw itemsError;
          }
        }

        resetForm();

        setMessage("Inspection package updated successfully.");

        await loadTemplates();
      } else {
        const { data: template, error: templateError } =
          await supabase
            .from("inspection_templates")
            .insert({
              organization_id: organizationId,
              name: name.trim(),
              description: description.trim() || null,
              package_type: packageType.trim() || null,
              monthly_price: parsedPrice,
              visits_per_month: parsedVisits,
              is_active: true,
            })
            .select("id")
            .single();

        if (templateError) {
          throw templateError;
        }

        if (items.length > 0) {
          const itemRows = items.map((item, index) => ({
            template_id: template.id,
            name: item.name,
            description: item.description || null,
            category: item.category || "General",
            sort_order: index,
            is_active: true,
          }));

          const { error: itemsError } = await supabase
            .from("inspection_template_items")
            .insert(itemRows);

          if (itemsError) {
            await supabase
              .from("inspection_templates")
              .delete()
              .eq("id", template.id);

            throw itemsError;
          }
        }

        resetForm();

        setMessage("Inspection package created successfully.");

        await loadTemplates();
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Unable to save inspection package."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(template: InspectionTemplate) {
    const confirmed = window.confirm(
      'Are you sure you want to delete "' +
        template.name +
        '"?\n\nThis will permanently remove the inspection package and its checklist items.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(template.id);
      setError("");
      setMessage("");

      const { error: deleteError } = await supabase
        .from("inspection_templates")
        .delete()
        .eq("id", template.id);

      if (deleteError) {
        throw deleteError;
      }

      if (editingTemplateId === template.id) {
        resetForm();
      }

      setMessage("Inspection package deleted successfully.");

      await loadTemplates();
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Unable to delete inspection package."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function printChecklist(template: InspectionTemplate) {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=800"
    );

    if (!printWindow) {
      setError(
        "The print window was blocked by your browser. Please allow pop-ups for this site and try again."
      );
      return;
    }

    const document = printWindow.document;

    document.open();

    const html = document.createElement("html");
    const head = document.createElement("head");
    const body = document.createElement("body");

    const title = document.createElement("title");
    title.textContent = template.name + " - Inspection Checklist";
    head.appendChild(title);

    const style = document.createElement("style");

    style.textContent = [
      "body {",
      "  font-family: Arial, Helvetica, sans-serif;",
      "  color: #111827;",
      "  margin: 30px;",
      "  font-size: 12px;",
      "}",
      ".header {",
      "  text-align: center;",
      "  margin-bottom: 24px;",
      "}",
      ".header h1 {",
      "  margin: 0;",
      "  font-size: 24px;",
      "}",
      ".header p {",
      "  margin: 6px 0 0;",
      "  color: #4b5563;",
      "  font-size: 13px;",
      "}",
      ".info-grid {",
      "  display: grid;",
      "  grid-template-columns: 1fr 1fr;",
      "  gap: 16px;",
      "  margin-bottom: 22px;",
      "}",
      ".field {",
      "  border-bottom: 1px solid #111827;",
      "  min-height: 24px;",
      "  padding-bottom: 4px;",
      "}",
      ".field-label {",
      "  font-weight: bold;",
      "  display: inline-block;",
      "  margin-right: 8px;",
      "}",
      "table {",
      "  width: 100%;",
      "  border-collapse: collapse;",
      "  margin-top: 12px;",
      "}",
      "th, td {",
      "  border: 1px solid #9ca3af;",
      "  padding: 8px;",
      "vertical-align: top;",
      "}",
      "th {",
      "  background: #f3f4f6;",
      "  font-size: 11px;",
      "  text-align: center;",
      "}",
      ".number {",
      "  width: 35px;",
      "  text-align: center;",
      "}",
      ".item {",
      "  width: 42%;",
      "}",
      ".check {",
      "  width: 9%;",
      "  text-align: center;",
      "  font-size: 18px;",
      "}",
      ".notes {",
      "  width: 30%;",
      "  min-height: 35px;",
      "}",
      ".item-name {",
      "  font-weight: bold;",
      "  font-size: 12px;",
      "}",
      ".category {",
      "  color: #4b5563;",
      "  font-size: 10px;",
      "  margin-top: 3px;",
      "}",
      ".description {",
      "  color: #4b5563;",
      "  font-size: 10px;",
      "  margin-top: 4px;",
      "}",
      ".general-notes {",
      "  margin-top: 24px;",
      "}",
      ".general-notes h2 {",
      "  font-size: 14px;",
      "  margin-bottom: 8px;",
      "}",
      ".notes-box {",
      "  height: 90px;",
      "  border: 1px solid #9ca3af;",
      "}",
      ".signature-grid {",
      "  display: grid;",
      "  grid-template-columns: 2fr 1fr;",
      "  gap: 30px;",
      "  margin-top: 30px;",
      "}",
      ".signature-line {",
      "  border-bottom: 1px solid #111827;",
      "  height: 30px;",
      "}",
      ".signature-label {",
      "  font-size: 10px;",
      "  margin-top: 5px;",
      "  color: #4b5563;",
      "}",
      ".footer {",
      "  margin-top: 24px;",
      "  font-size: 9px;",
      "  color: #6b7280;",
      "  text-align: center;",
      "}",
      "@media print {",
      "  body { margin: 15px; }",
      "  .no-print { display: none !important; }",
      "}",
    ].join("\n");

    head.appendChild(style);

    const header = document.createElement("div");
    header.className = "header";

    const heading = document.createElement("h1");
    heading.textContent = template.name;
    header.appendChild(heading);

    const subtitle = document.createElement("p");
    subtitle.textContent = "Property Inspection Checklist";
    header.appendChild(subtitle);

    body.appendChild(header);

    const infoGrid = document.createElement("div");
    infoGrid.className = "info-grid";

    const infoFields = [
      "Property",
      "Inspection Date",
      "Inspector",
      "Package",
    ];

    infoFields.forEach((label) => {
      const field = document.createElement("div");
      field.className = "field";

      const labelElement = document.createElement("span");
      labelElement.className = "field-label";
      labelElement.textContent = label + ":";

      field.appendChild(labelElement);

      if (label === "Package") {
        const packageText = document.createElement("span");
        packageText.textContent = template.name;
        field.appendChild(packageText);
      }

      infoGrid.appendChild(field);
    });

    body.appendChild(infoGrid);

    const table = document.createElement("table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = [
      "#",
      "Inspection Item",
      "Pass",
      "Needs Attention",
      "Failed",
      "N/A",
      "Notes",
    ];

    headers.forEach((headerText) => {
      const cell = document.createElement("th");
      cell.textContent = headerText;
      headerRow.appendChild(cell);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    template.inspection_template_items.forEach((item, index) => {
      const row = document.createElement("tr");

      const numberCell = document.createElement("td");
      numberCell.className = "number";
      numberCell.textContent = String(index + 1);
      row.appendChild(numberCell);

      const itemCell = document.createElement("td");
      itemCell.className = "item";

      const itemNameElement = document.createElement("div");
      itemNameElement.className = "item-name";
      itemNameElement.textContent = item.name;
      itemCell.appendChild(itemNameElement);

      const categoryElement = document.createElement("div");
      categoryElement.className = "category";
      categoryElement.textContent = item.category || "General";
      itemCell.appendChild(categoryElement);

      if (item.description) {
        const descriptionElement = document.createElement("div");
        descriptionElement.className = "description";
        descriptionElement.textContent = item.description;
        itemCell.appendChild(descriptionElement);
      }

      row.appendChild(itemCell);

      for (let i = 0; i < 4; i += 1) {
        const checkCell = document.createElement("td");
        checkCell.className = "check";
        checkCell.textContent = "☐";
        row.appendChild(checkCell);
      }

      const notesCell = document.createElement("td");
      notesCell.className = "notes";
      notesCell.textContent = "";
      row.appendChild(notesCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    body.appendChild(table);

    const generalNotes = document.createElement("div");
    generalNotes.className = "general-notes";

    const generalNotesHeading = document.createElement("h2");
    generalNotesHeading.textContent = "General Notes";
    generalNotes.appendChild(generalNotesHeading);

    const notesBox = document.createElement("div");
    notesBox.className = "notes-box";
    generalNotes.appendChild(notesBox);

    body.appendChild(generalNotes);

    const signatureGrid = document.createElement("div");
    signatureGrid.className = "signature-grid";

    const signatureSection = document.createElement("div");

    const signatureLine = document.createElement("div");
    signatureLine.className = "signature-line";
    signatureSection.appendChild(signatureLine);

    const signatureLabel = document.createElement("div");
    signatureLabel.className = "signature-label";
    signatureLabel.textContent = "Inspector Signature";
    signatureSection.appendChild(signatureLabel);

    signatureGrid.appendChild(signatureSection);

    const dateSection = document.createElement("div");

    const dateLine = document.createElement("div");
    dateLine.className = "signature-line";
    dateSection.appendChild(dateLine);

    const dateLabel = document.createElement("div");
    dateLabel.className = "signature-label";
    dateLabel.textContent = "Date";
    dateSection.appendChild(dateLabel);

    signatureGrid.appendChild(dateSection);

    body.appendChild(signatureGrid);

    const footer = document.createElement("div");
    footer.className = "footer";
    footer.textContent =
      "PropertyCare Pal • Inspection Checklist";
    body.appendChild(footer);

    html.appendChild(head);
    html.appendChild(body);

    document.appendChild(html);
    document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-gray-600">
            Loading inspection packages...
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inspection Packages
            </h1>

            <p className="mt-2 text-gray-600">
              Create and manage inspection packages for your properties.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/inspections")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Inspections
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTemplateId
                ? "Edit Inspection Package"
                : "Create Inspection Package"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Define the package details and the inspection checklist.
            </p>

            <form
              onSubmit={saveTemplate}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Package Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Standard Home Check"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Package Type
                </label>

                <select
                  value={packageType}
                  onChange={(event) =>
                    setPackageType(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option>Home Check</option>
                  <option>Seasonal Property Care</option>
                  <option>Vacation Home</option>
                  <option>Premium Property Care</option>
                  <option>Custom</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="Describe what this package includes."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Monthly Price
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyPrice}
                      onChange={(event) =>
                        setMonthlyPrice(event.target.value)
                      }
                      placeholder="199.00"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Visits Per Month
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={visitsPerMonth}
                    onChange={(event) =>
                      setVisitsPerMonth(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Checklist Items
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Add the items your inspector should check during each visit.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Item Name
                      </label>

                      <input
                        type="text"
                        value={itemName}
                        onChange={(event) =>
                          setItemName(event.target.value)
                        }
                        placeholder="Check for water leaks"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Category
                      </label>

                      <select
                        value={itemCategory}
                        onChange={(event) =>
                          setItemCategory(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option>General</option>
                        <option>Interior</option>
                        <option>Exterior</option>
                        <option>HVAC</option>
                        <option>Security</option>
                        <option>Pest Control</option>
                        <option>Pool</option>
                        <option>Plumbing</option>
                        <option>Electrical</option>
                        <option>Landscaping</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Description
                      </label>

                      <textarea
                        value={itemDescription}
                        onChange={(event) =>
                          setItemDescription(event.target.value)
                        }
                        rows={2}
                        placeholder="What should the inspector look for?"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                    >
                      Add Checklist Item
                    </button>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {index + 1}. {item.name}
                            </span>

                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              {item.category}
                            </span>
                          </div>

                          {item.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving Package..."
                    : editingTemplateId
                    ? "Save Changes"
                    : "Create Inspection Package"}
                </button>

                {editingTemplateId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Existing Packages
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Inspection packages currently available in your organization.
              </p>
            </div>

            {templates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="font-medium text-gray-900">
                  No inspection packages yet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Create your first package using the form.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>

                        {template.package_type && (
                          <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {template.package_type}
                          </span>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          template.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {template.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    {template.description && (
                      <p className="mt-3 text-sm text-gray-600">
                        {template.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Monthly Price
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {template.monthly_price !== null
                            ? "$" +
                              Number(
                                template.monthly_price
                              ).toFixed(2)
                            : "Not set"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Visits Per Month
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {template.visits_per_month}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Checklist
                        </h4>

                        <span className="text-xs text-gray-500">
                          {template.inspection_template_items.length} items
                        </span>
                      </div>

                      {template.inspection_template_items.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {template.inspection_template_items.map(
                            (item, index) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2"
                              >
                                <span className="text-sm font-medium text-gray-400">
                                  {index + 1}.
                                </span>

                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800">
                                    {item.name}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {item.category}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500">
                          No checklist items added.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          startEditTemplate(template)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          printChecklist(template)
                        }
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Print Checklist
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteTemplate(template)
                        }
                        disabled={deletingId === template.id}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === template.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}