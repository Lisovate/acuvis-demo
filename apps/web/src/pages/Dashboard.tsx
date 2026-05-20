import { Link } from "react-router-dom";
import type { Link as ShortLink } from "@acuvis-demo/shared";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";
import { useApi } from "../hooks/useApi.js";
import { CopyButton } from "../components/CopyButton.js";
import { compactNumber, formatDate, shortUrl } from "../lib/format.js";

export function Dashboard() {
  const { token } = useAuth();
  const { data: links, error, loading, refresh } = useApi<ShortLink[]>("/links");

  const onDelete = async (id: number) => {
    if (!confirm("Delete this link? Analytics data will also be removed.")) return;
    try {
      await apiFetch(`/links/${id}`, { method: "DELETE", token });
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "delete_failed");
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your links</h1>
        <Link
          to="/new"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New link
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {links && links.length === 0 && (
        <p className="mt-6 text-slate-500">No links yet. Create your first one.</p>
      )}

      {links && links.length > 0 && (
        <ul className="mt-6 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/links/${link.id}`}
                    className="font-mono text-sm text-indigo-700 hover:underline"
                  >
                    /{link.slug}
                  </Link>
                  {link.hasPassword && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      password
                    </span>
                  )}
                  {link.expiresAt && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                      expires {formatDate(link.expiresAt)}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-slate-500">{link.url}</p>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <span className="text-sm text-slate-500">{compactNumber(link.clicks)} clicks</span>
                <CopyButton value={shortUrl(link.slug)} />
                <button
                  onClick={() => onDelete(link.id)}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
