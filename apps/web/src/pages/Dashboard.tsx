import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Link as ShortLink } from "@acuvis-demo/shared";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";

export function Dashboard() {
  const { token, user, activeWorkspace } = useAuth();
  const [links, setLinks] = useState<ShortLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = activeWorkspace?.id ?? null;
  const isAdmin = activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin";

  useEffect(() => {
    if (!workspaceId) return;
    apiFetch<ShortLink[]>("/links", { token, workspaceId })
      .then(setLinks)
      .catch((err) => setError(err.message ?? "failed_to_load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const remove = async (link: ShortLink) => {
    if (!confirm(`Delete /${link.slug}?`)) return;
    try {
      await apiFetch<void>(`/links/${link.id}`, { method: "DELETE", token, workspaceId });
      setLinks((prev) => prev?.filter((l) => l.id !== link.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "delete_failed");
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Links</h1>
          {activeWorkspace && <p className="text-sm text-slate-500">{activeWorkspace.name}</p>}
        </div>
        <Link
          to="/new"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New link
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {links && links.length === 0 && (
        <p className="mt-6 text-slate-500">No links yet. Create your first one.</p>
      )}

      {links && links.length > 0 && (
        <ul className="mt-6 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-mono text-sm text-indigo-700">/{link.slug}</p>
                <p className="truncate text-sm text-slate-500">{link.url}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="text-sm text-slate-500">{link.clicks} clicks</span>
                {(isAdmin || link.createdBy === user?.id) && (
                  <button
                    onClick={() => void remove(link)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
