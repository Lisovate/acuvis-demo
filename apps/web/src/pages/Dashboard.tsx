import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Link as ShortLink } from "@acuvis-demo/shared";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";

export function Dashboard() {
  const { token } = useAuth();
  const [links, setLinks] = useState<ShortLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ShortLink[]>("/links", { token })
      .then(setLinks)
      .catch((err) => setError(err.message ?? "failed_to_load"));
  }, [token]);

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
      {links && links.length === 0 && (
        <p className="mt-6 text-slate-500">No links yet. Create your first one.</p>
      )}

      {links && links.length > 0 && (
        <ul className="mt-6 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-mono text-sm text-indigo-700">/{link.slug}</p>
                <p className="text-sm text-slate-500">{link.url}</p>
              </div>
              <span className="text-sm text-slate-500">{link.clicks} clicks</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
