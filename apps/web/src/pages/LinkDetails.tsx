import { useParams, Link as RouterLink } from "react-router-dom";
import type { ClickSummary, Link as ShortLink } from "@acuvis-demo/shared";
import { useApi } from "../hooks/useApi.js";
import { Sparkline } from "../components/Sparkline.js";
import { CopyButton } from "../components/CopyButton.js";
import { compactNumber, formatDateTime, shortUrl } from "../lib/format.js";

export function LinkDetails() {
  const { id } = useParams<{ id: string }>();
  const link = useApi<ShortLink>(id ? `/links/${id}` : null);
  const summary = useApi<ClickSummary>(id ? `/links/${id}/clicks` : null);

  if (link.loading) return <p className="text-slate-500">Loading...</p>;
  if (link.error) return <p className="text-red-600">{link.error}</p>;
  if (!link.data) return null;

  const url = shortUrl(link.data.slug);

  return (
    <section>
      <RouterLink to="/" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to dashboard
      </RouterLink>

      <header className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">/{link.data.slug}</h1>
          <p className="mt-1 text-sm text-slate-500">{link.data.url}</p>
        </div>
        <CopyButton value={url} label="Copy short URL" />
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total clicks" value={compactNumber(link.data.clicks)} />
        <Stat label="Created" value={formatDateTime(link.data.createdAt)} />
        <Stat
          label="Expires"
          value={link.data.expiresAt ? formatDateTime(link.data.expiresAt) : "never"}
        />
        <Stat label="Password" value={link.data.hasPassword ? "required" : "none"} />
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Last 30 days</h2>
        <div className="mt-3 rounded border border-slate-200 bg-white p-4">
          {summary.loading && <p className="text-sm text-slate-500">Loading...</p>}
          {summary.data && <Sparkline data={summary.data.daily} width={480} height={80} />}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Top referrers</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {summary.data?.topReferers.length
            ? summary.data.topReferers.map((r, i) => (
                <li key={i} className="flex items-center justify-between p-3 text-sm">
                  <span className="truncate text-slate-700">{r.referer ?? "(direct)"}</span>
                  <span className="text-slate-500">{r.count}</span>
                </li>
              ))
            : (
                <li className="p-3 text-sm text-slate-500">No referrer data yet.</li>
              )}
        </ul>
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
