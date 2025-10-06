"use client";
import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  useEffect(() => {
    // Zkontroluj, zda je uživatel přihlášen (uloženo v localStorage)
    const saved = localStorage.getItem("admin_authenticated");
    if (saved === "true") {
      setAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      toast.success("✅ Přihlášení úspěšné");
      return true;
    } else {
      toast.error("❌ Nesprávné heslo");
      return false;
    }
  };

  const logout = () => {
    setAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
    toast("👋 Odhlášeno");
  };

  return (
    <AdminAuthContext.Provider
      value={{ authenticated, loading, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
