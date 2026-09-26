import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthResponse, Workspace } from "@acuvis-demo/shared";
import { apiFetch } from "./api.js";

type AuthState = {
  token: string | null;
  user: AuthResponse["user"] | null;
  activeWorkspaceId?: number | null;
};

type AuthContextValue = AuthState & {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchWorkspace: (id: number) => void;
  refreshWorkspaces: () => Promise<void>;
};

const STORAGE_KEY = "acuvis-demo:auth";

function loadInitial(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw);
  } catch {
    return { token: null, user: null };
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitial);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const persist = (next: AuthState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const refreshWorkspaces = useCallback(async () => {
    if (!state.token) return;
    const list = await apiFetch<Workspace[]>("/workspaces", { token: state.token });
    setWorkspaces(list);
    // Fall back to the first workspace (the personal one) when nothing is picked
    // or the picked one is gone.
    if (!list.some((w) => w.id === state.activeWorkspaceId) && list[0]) {
      persist({ ...state, activeWorkspaceId: list[0].id });
    }
  }, [state]);

  useEffect(() => {
    void refreshWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.token]);

  const switchWorkspace = useCallback(
    (id: number) => persist({ ...state, activeWorkspaceId: id }),
    [state],
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persist({ token: res.token, user: res.user });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persist({ token: res.token, user: res.user });
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, user: null });
    setWorkspaces([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === state.activeWorkspaceId) ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      workspaces,
      activeWorkspace,
      login,
      register,
      logout,
      switchWorkspace,
      refreshWorkspaces,
    }),
    [state, workspaces, activeWorkspace, login, register, logout, switchWorkspace, refreshWorkspaces],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
