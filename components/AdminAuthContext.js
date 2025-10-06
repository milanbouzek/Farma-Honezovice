import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_authenticated");
    if (saved === "true") setAuthenticated(true);
  }, []);

  const login = (password) => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      toast.success("✅ Přihlášeno!");
      return true;
    } else {
      toast.error("❌ Špatné heslo");
      return false;
    }
  };

  const logout = () => {
    setAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
    toast("Odhlášeno");
  };

  return (
    <AdminAuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
