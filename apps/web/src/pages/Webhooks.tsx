import { useCallback, useEffect, useState } from "react";
import { WEBHOOK_EVENTS, type Delivery, type Webhook, type WebhookEvent } from "@acuvis-demo/shared";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";

export function Webhooks() {
  const { token, activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id ?? null;
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["link.created"]);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [deliveries, setDeliveries] = useState<Record<number, Delivery[]>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setHooks(await apiFetch<Webhook[]>("/webhooks", { token, workspaceId }));
  }, [token, workspaceId]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const toggleEvent = (event: WebhookEvent) =>
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const hook = await apiFetch<Webhook>("/webhooks", {
        method: "POST",
        token,
        workspaceId,
        body: JSON.stringify({ url, events }),
      });
      setUrl("");
      setRevealed(hook.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create_failed");
    }
  };

  const remove = async (hook: Webhook) => {
    if (!confirm(`Delete the webhook to ${hook.url}?`)) return;
    await apiFetch<void>(`/webhooks/${hook.id}`, { method: "DELETE", token, workspaceId });
    await load();
  };

  const sendTest = async (hook: Webhook) => {
    await apiFetch(`/webhooks/${hook.id}/test`, { method: "POST", token, workspaceId });
    await showDeliveries(hook);
  };

  const showDeliveries = async (hook: Webhook) => {
    const list = await apiFetch<Delivery[]>(`/webhooks/${hook.id}/deliveries`, { token, workspaceId });
    setDeliveries((prev) => ({ ...prev, [hook.id]: list }));
  };

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Webhooks</h1>
        <p className="text-sm text-slate-500">
          Get a signed POST when links are created, clicked or deleted in {activeWorkspace?.name}.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={create} className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/hooks/links"
          className="block w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-4 text-sm">
          {WEBHOOK_EVENTS.map((event) => (
            <label key={event} className="flex items-center gap-2">
              <input type="checkbox" checked={events.includes(event)} onChange={() => toggleEvent(event)} />
              <span className="font-mono">{event}</span>
            </label>
          ))}
        </div>
        <button className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Add webhook
        </button>
      </form>

      <ul className="space-y-4">
        {hooks.map((hook) => (
          <li key={hook.id} className="rounded border border-slate-200 bg-white p-4 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-mono">{hook.url}</p>
                <p className="text-slate-500">{hook.events.join(", ")}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button onClick={() => void sendTest(hook)} className="hover:underline">
                  Send test
                </button>
                <button onClick={() => void showDeliveries(hook)} className="hover:underline">
                  Deliveries
                </button>
                <button onClick={() => void remove(hook)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-3 font-mono text-xs text-slate-600">
              Signing secret:{" "}
              {revealed === hook.id ? (
                hook.secret
              ) : (
                <button onClick={() => setRevealed(hook.id)} className="underline">
                  reveal
                </button>
              )}
            </p>
            {deliveries[hook.id] && (
              <table className="mt-3 w-full text-left text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1">Event</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>HTTP</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries[hook.id]!.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="py-1 font-mono">{d.event}</td>
                      <td>{d.status}</td>
                      <td>{d.attempts}</td>
                      <td>{d.responseStatus ?? "—"}</td>
                      <td>{new Date(d.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
