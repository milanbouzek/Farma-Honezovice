// components/AdminAuthContext.js
import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // při startu zkontrolujeme localStorage
    const saved = typeof window !== "undefined" && localStorage.getItem("admin_authenticated");
    setAuthenticated(saved === "true");
    setReady(true);
  }, []);

  const login = (password) => {
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return { success: false, message: "No admin password set in env." };
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_authenticated", "true");
      setAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: "Špatné heslo" };
  };

  const logout = () => {
    localStorage.removeItem("admin_authenticated");
    setAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ authenticated, ready, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
