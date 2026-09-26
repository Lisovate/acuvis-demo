import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth.js";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher.js";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, activeWorkspace } = useAuth();
  const canManage = activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin";
  const navigate = useNavigate();

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-slate-900">
            acuvis<span className="text-indigo-600">/demo</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <WorkspaceSwitcher />
                <Link to="/members" className="hover:underline">
                  Members
                </Link>
                {canManage && (
                  <Link to="/webhooks" className="hover:underline">
                    Webhooks
                  </Link>
                )}
                <span className="text-slate-500">{user.email}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
