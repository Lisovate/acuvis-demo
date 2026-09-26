import { useCallback, useEffect, useState } from "react";
import {
  WORKSPACE_ROLES,
  type Invite,
  type Member,
  type WorkspaceRole,
} from "@acuvis-demo/shared";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";

export function Members() {
  const { token, user, activeWorkspace } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [error, setError] = useState<string | null>(null);

  const workspaceId = activeWorkspace?.id;
  const canManage = activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin";

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setMembers(await apiFetch<Member[]>(`/workspaces/${workspaceId}/members`, { token }));
    if (canManage) {
      setInvites(await apiFetch<Invite[]>(`/workspaces/${workspaceId}/invites`, { token }));
    }
  }, [workspaceId, token, canManage]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch(`/workspaces/${workspaceId}/invites`, {
        method: "POST",
        token,
        body: JSON.stringify({ email, role }),
      });
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "invite_failed");
    }
  };

  const changeRole = async (member: Member, next: WorkspaceRole) => {
    try {
      await apiFetch(`/workspaces/${workspaceId}/members/${member.userId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ role: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "update_failed");
    }
  };

  const remove = async (member: Member) => {
    const leaving = member.userId === user?.id;
    if (!confirm(leaving ? "Leave this workspace?" : `Remove ${member.email}?`)) return;
    try {
      await apiFetch(`/workspaces/${workspaceId}/members/${member.userId}`, {
        method: "DELETE",
        token,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "remove_failed");
    }
  };

  if (!activeWorkspace) return null;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-sm text-slate-500">{activeWorkspace.name}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{m.email}</p>
              <p className="text-xs text-slate-500">Joined {new Date(m.joinedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              {canManage && m.userId !== user?.id ? (
                <select
                  value={m.role}
                  onChange={(e) => void changeRole(m, e.target.value as WorkspaceRole)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  {WORKSPACE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-slate-500">{m.role}</span>
              )}
              {(canManage || m.userId === user?.id) && (
                <button onClick={() => void remove(m)} className="text-sm text-red-600 hover:underline">
                  {m.userId === user?.id ? "Leave" : "Remove"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Invite someone</h2>
          <form onSubmit={invite} className="flex flex-wrap gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="min-w-64 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="rounded border border-slate-300 px-2 py-2 text-sm"
            >
              {WORKSPACE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Send invite
            </button>
          </form>

          {invites.length > 0 && (
            <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white text-sm">
              {invites.map((i) => (
                <li key={i.id} className="flex justify-between p-3">
                  <span>{i.email}</span>
                  <span className="text-slate-500">
                    {i.role} · expires {new Date(i.expiresAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
