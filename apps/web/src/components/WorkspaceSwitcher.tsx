import { useAuth } from "../auth.js";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, switchWorkspace } = useAuth();
  if (workspaces.length === 0) return null;

  return (
    <select
      aria-label="Workspace"
      value={activeWorkspaceId ?? ""}
      onChange={(e) => switchWorkspace(Number(e.target.value))}
      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}
