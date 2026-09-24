"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type MaintenanceTemplate = {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  is_active: boolean;
};

export default function MaintenancePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [planName, setPlanName] = useState("");
const [season, setSeason] = useState("");
const [description, setDescription] = useState("");
const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (!loading && user && role === "Client") {
      router.push("/client-portal");
      return;
    }
  }, [loading, user, role, router]);
  async function handleCreatePlan() {
    if (!user) return;
  
    if (!planName.trim()) {
      alert("Please enter a maintenance plan name.");
      return;
    }
  
    setSavingPlan(true);
  
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
  
    if (profileError || !profile?.organization_id) {
      console.error("Error loading profile:", profileError);
      alert("Unable to determine your organization.");
      setSavingPlan(false);
      return;
    }
  
    const { error } = await supabase
      .from("maintenance_templates")
      .insert({
        organization_id: profile.organization_id,
        name: planName.trim(),
        season: season || null,
        description: description.trim() || null,
        is_active: true,
      });
  
    if (error) {
      console.error("Error creating maintenance plan:", error);
      alert("Unable to create maintenance plan.");
      setSavingPlan(false);
      return;
    }
  
    setPlanName("");
    setSeason("");
    setDescription("");
    setSavingPlan(false);
  
    document
      .getElementById("create-maintenance-form")
      ?.classList.add("hidden");
  
    const { data: refreshedTemplates } = await supabase
      .from("maintenance_templates")
      .select("id, name, description, season, is_active")
      .order("name");
  
    setTemplates(refreshedTemplates ?? []);
  }
  useEffect(() => {
    async function loadTemplates() {
      if (!user || role === "Client") return;

      setLoadingTemplates(true);

      const { data, error } = await supabase
        .from("maintenance_templates")
        .select("id, name, description, season, is_active")
        .order("name");

      if (error) {
        console.error("Error loading maintenance templates:", error);
        setTemplates([]);
      } else {
        setTemplates(data ?? []);
      }

      setLoadingTemplates(false);
    }

    loadTemplates();
  }, [user, role]);

  if (loading || !user) {
    return null;
  }

  if (role === "Client") {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
      <div
  id="create-maintenance-form"
  className="hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
>
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-gray-900">
      Create Maintenance Plan
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Create a seasonal maintenance template that can later be assigned to properties.
    </p>
  </div>

  <div className="grid gap-6 md:grid-cols-2">
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Plan Name
      </label>
      <input
  type="text"
  placeholder="Example: Summer Property Maintenance"
  value={planName}
  onChange={(e) => setPlanName(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
/>
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Season
      </label>
      <select
  value={season}
  onChange={(e) => setSeason(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
>
        <option value="" disabled>
          Select a season
        </option>
        <option value="Spring">Spring</option>
        <option value="Summer">Summer</option>
        <option value="Fall">Fall</option>
        <option value="Winter">Winter</option>
        <option value="Year-Round">Year-Round</option>
      </select>
    </div>
  </div>

  <div className="mt-6">
    <label className="mb-2 block text-sm font-medium text-gray-700">
      Description
    </label>
    <textarea
  rows={4}
  placeholder="Describe the maintenance plan..."
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
/>
  </div>

  <div className="mt-6 flex gap-3">
  <button
  type="button"
  onClick={handleCreatePlan}
  disabled={savingPlan}
  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {savingPlan ? "Saving..." : "Save Maintenance Plan"}
</button>
    <button
      type="button"
      onClick={() => {
        document
          .getElementById("create-maintenance-form")
          ?.classList.add("hidden");
      }}
      className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      Cancel
    </button>
  </div>
</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Maintenance
            </h1>
            <p className="mt-1 text-gray-600">
              Manage seasonal maintenance plans and property maintenance.
            </p>
          </div>

          <button
  type="button"
  onClick={() => {
    document
      .getElementById("create-maintenance-form")
      ?.classList.toggle("hidden");
  }}
  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
>
  + Create Maintenance Plan
</button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Maintenance Templates
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Seasonal maintenance templates you can assign to properties.
            </p>
          </div>

          {loadingTemplates ? (
            <p className="text-sm text-gray-500">
              Loading maintenance templates...
            </p>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No maintenance templates yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Create your first seasonal maintenance plan to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
              <div
              key={template.id}
              onClick={() => router.push(`/maintenance/plans/${template.id}`)}
              className="cursor-pointer rounded-xl border border-gray-200 p-5 transition hover:border-blue-400 hover:shadow-sm"
            >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-gray-900">
                      {template.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        template.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {template.season && (
                    <p className="mt-3 text-sm font-medium text-blue-600">
                      {template.season}
                    </p>
                  )}

                  {template.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {template.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}