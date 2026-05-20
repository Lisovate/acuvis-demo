import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { useAuth } from "../auth.js";

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function useApi<T>(path: string | null): State<T> & { refresh: () => void } {
  const { token } = useAuth();
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: path !== null });

  const fetchOnce = useCallback(() => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiFetch<T>(path, { token })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((err) => setState({ data: null, error: err.message ?? "failed", loading: false }));
  }, [path, token]);

  useEffect(() => {
    fetchOnce();
  }, [fetchOnce]);

  return { ...state, refresh: fetchOnce };
}
