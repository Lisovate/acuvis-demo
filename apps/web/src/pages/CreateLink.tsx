import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Link as ShortLink } from "@acuvis-demo/shared";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";

export function CreateLink() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch<ShortLink>("/links", {
        method: "POST",
        token,
        body: JSON.stringify({ url, slug: slug || undefined }),
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "create_failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">New link</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="text-slate-700">Destination URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://example.com/long-path"
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Custom slug (optional)</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-link"
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 font-mono"
          />
          <span className="mt-1 block text-xs text-slate-500">
            3-32 characters, letters/numbers/hyphens/underscores.
          </span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "..." : "Create"}
        </button>
      </form>
    </section>
  );
}
