import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  useEffect(() => {
    setMounted(true);
    try {
      const ok = typeof window !== "undefined" && sessionStorage.getItem("admin_authenticated") === "true";
      setAuthenticated(Boolean(ok));
    } catch {
      setAuthenticated(false);
    }
  }, []);

  const handleLogin = () => {
    if (!ADMIN_PASSWORD) {
      toast.error("❌ Chybí proměnná NEXT_PUBLIC_ADMIN_PASSWORD!");
      return;
    }

    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem("admin_authenticated", "true");
      } catch {}
      setAuthenticated(true);
      toast.success("✅ Přihlášeno!");
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("admin_authenticated");
    } catch {}
    setAuthenticated(false);
    toast("👋 Odhlášeno");
    router.push("/admin");
  };

  if (!mounted) return null;

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
        <input
          type="password"
          placeholder="Zadejte heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded mb-2 w-64"
        />
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  const navLink = (href, label, color) => {
    const active = router.pathname === href;
    return (
      <Link href={href} key={href}>
        <a
          className={`px-3 py-1 rounded text-white ${
            active ? "bg-black" : `${color} hover:opacity-80`
          }`}
        >
          {label}
        </a>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-center" />
      <header className="mb-6 flex justify-between items-center flex-wrap">
        <nav className="flex gap-4 flex-wrap">
          {navLink("/admin", "Dashboard", "bg-blue-500")}
          {navLink("/admin/objednavky", "Objednávky", "bg-blue-500")}
          {navLink("/admin/statistika", "Statistika", "bg-green-500")}
          {navLink("/admin/naklady", "Náklady", "bg-red-500")}
          {navLink("/admin/produkcevajec", "Produkce vajec", "bg-purple-500")}
        </nav>

        <button
          onClick={handleLogout}
          className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
        >
          Odhlásit se
        </button>
      </header>

      <main>{children}</main>
    </div>
  );
}
