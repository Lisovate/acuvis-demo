import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";

export function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { token, refreshWorkspaces, switchWorkspace } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const inviteToken = params.get("token");

  useEffect(() => {
    if (!inviteToken || !token) return;
    apiFetch<{ workspaceId: number }>("/invites/accept", {
      method: "POST",
      token,
      body: JSON.stringify({ token: inviteToken }),
    })
      .then(async ({ workspaceId }) => {
        await refreshWorkspaces();
        switchWorkspace(workspaceId);
        navigate("/");
      })
      .catch((err) => setError(err.message ?? "accept_failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken, token]);

  if (!inviteToken) {
    return <p className="text-sm text-red-600">This invite link is missing its token.</p>;
  }
  return (
    <section className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold">Joining workspace…</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}
