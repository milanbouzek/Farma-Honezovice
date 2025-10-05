import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false); // aby se předešlo SSR-flash
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  useEffect(() => {
    // Po mountu zkontrolujeme sessionStorage
    setMounted(true);
    try {
      const ok = typeof window !== "undefined" && sessionStorage.getItem("admin_authenticated") === "true";
      setAuthenticated(Boolean(ok));
    } catch (e) {
      setAuthenticated(false);
    }
  }, []);

  const handleLogin = () => {
    if (!ADMIN_PASSWORD) {
      toast.error("Chyba: není nastavené ADMIN heslo (env).");
      return;
    }
    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem("admin_authenticated", "true");
      } catch (e) {
        /* ignore */
      }
      setAuthenticated(true);
      toast.success("✅ Přihlášeno!");
      // zůstáváme na aktuální stránce; client-side nav neztratí sessionStorage
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("admin_authenticated");
    } catch (e) {}
    setAuthenticated(false);
    toast("👋 Odhlášeno");
    // přesměrujeme na hlavní admin (bude vyžadovat opětovné přihlášení)
    router.push("/admin");
  };

  // počkáme na mount (zabráníme flashování loginu při SSR)
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
        <div className="flex gap-2">
          <button
            onClick={handleLogin}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Přihlásit se
          </button>
          <button
            onClick={() => {
              setPassword("");
            }}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Vymazat
          </button>
        </div>
      </div>
    );
  }

  // po přihlášení: zobrazení administrátorského panelu (menu + children)
  const navLink = (href, label, extra = "bg-gray-300") => {
    const active = router.pathname === href;
    const base = `px-3 py-1 rounded text-white`;
    const bg = active ? "bg-black" : extra;
    return (
      <Link href={href} key={href}>
        <a className={`${base} ${bg}`}>{label}</a>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-center" />
      <header className="mb-6 flex justify-between items-center flex-wrap">
        <nav className="flex gap-4 flex-wrap">
          {navLink("/admin", "Dashboard", "bg-blue-500 hover:bg-blue-600")}
          {navLink("/admin/objednavky", "Objednávky", "bg-blue-500 hover:bg-blue-600")}
          {navLink("/admin/statistika", "Statistika", "bg-green-500 hover:bg-green-600")}
          {navLink("/admin/naklady", "Náklady", "bg-red-500 hover:bg-red-600")}
          {navLink("/admin/produkcevajec", "Produkce vajec", "bg-purple-500 hover:bg-purple-600")}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
