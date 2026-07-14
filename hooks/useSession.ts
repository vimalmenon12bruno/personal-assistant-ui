"use client";

import { useState, useEffect } from "react";

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { sessionId: id } = await res.json();
      sessionStorage.setItem("assistantSessionId", id);
      setSessionId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("assistantSessionId");
    if (stored) {
      setSessionId(stored);
      setLoading(false);
    } else {
      createSession();
    }
  }, []);

  const resetSession = () => {
    sessionStorage.removeItem("assistantSessionId");
    setSessionId(null);
    createSession();
  };

  return { sessionId, loading, error, resetSession };
}
