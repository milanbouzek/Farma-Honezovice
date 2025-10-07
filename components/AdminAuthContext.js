// components/AdminAuthContext.js
import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Kontrola localStorage jen v prohlížeči
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_authenticated");
      setAuthenticated(saved === "true");
    }
    setReady(true);
  }, []);

  const login = (password) => {
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
      return { success: false, message: "No admin password set in env." };
    }
    if (password === ADMIN_PASSWORD) {
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_authenticated", "true");
      }
      setAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: "Špatné heslo" };
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_authenticated");
    }
    setAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ authenticated, ready, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
