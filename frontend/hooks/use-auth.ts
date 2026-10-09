"use client";
import { useEffect, useState } from "react";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "analyst" | "viewer";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return { user, loading, logout };
}
