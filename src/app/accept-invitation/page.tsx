"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const supabase = getSupabaseClient();

const [email, setEmail] = useState("");
const [error, setError] = useState("");
useEffect(() => {
    async function loadInvitation() {
      if (!invitationId) {
        setError("Invitation ID is missing.");
        return;
      }
  
      const { data, error } = await supabase
        .from("client_invitations")
        .select("email")
        .eq("id", invitationId);
  
      if (error) {
        setError(error.message);
        return;
      }
  
      console.log("INVITATION DATA:", data);
setEmail(data[0]?.email ?? "");
    }
  
    loadInvitation();
  }, [invitationId, supabase]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          You're Invited
        </h1>

        <p className="mt-3 text-gray-600">
          You've been invited to access your property through PropertyCare Pal.
        </p>
        {email && (
  <p className="mt-4 text-sm text-gray-700">
    Invitation sent to: <strong>{email}</strong>
  </p>
)}

{error && (
  <p className="mt-4 text-sm text-red-600">
    {error}
  </p>
)}

        {invitationId && (
          <p className="mt-4 text-sm text-gray-500">
            Invitation #{invitationId}
          </p>
        )}

<button
  type="button"
  onClick={() => {
    window.location.href = `/signup?invitation=${invitationId}`;
  }}
  className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800"
>
  Create Your Account
</button>
      </div>
    </main>
  );
}