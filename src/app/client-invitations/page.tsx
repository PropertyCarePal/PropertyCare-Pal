"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function ClientInvitationsPage() {
    const supabase = getSupabaseClient();
  const [email, setEmail] = useState("");
  const [property, setProperty] = useState("");
  async function getCurrentProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      throw new Error("You must be logged in.");
    }
  
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", user.id)
      .single();
  
    if (error) {
      throw error;
    }
  
    return profile;
  }
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    if (!property || !email) {
      alert("Please select a property and enter a client email.");
      return;
    }
  
    try {
      const profile = await getCurrentProfile();
  
      const { error } = await supabase
        .from("client_invitations")
        .insert({
          organization_id: profile.organization_id,
          property_id: property,
          email: email,
          role: "owner",
          status: "pending",
          created_by: profile.id,
        });
  
      if (error) {
        alert(error.message);
        return;
      }
  
      alert("Invitation saved successfully.");
  
      setEmail("");
      setProperty("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving the invitation.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Invite a Client
          </h1>

          <p className="mt-2 text-gray-600">
            Invite a property owner to access their property through
            PropertyCare Pal.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="property"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Property
              </label>

              <select
                id="property"
                value={property}
                onChange={(event) => setProperty(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
              >
                <option value="">Select a property</option>
                <option value="0509ce29-55a8-4f6e-b74d-9aec45d4a8ef">Ross Residence</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Client Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="client@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Send Invitation
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}