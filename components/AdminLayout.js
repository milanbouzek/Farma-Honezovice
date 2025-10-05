import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true); // kontrola načtení
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("admin_authenticated");
    if (saved === "true") setAuthenticated(true);
    setLoadingAuth(false);
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      toast.success("✅ Přihlášeno!");
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  if (loadingAuth) return null; // počkej, než se načte auth stav

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
        <input
          type="password"
          placeholder="Zadejte heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 p-2 rounded mb-2 w-64 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  const menuItems = [
    { name: "🏠 Dashboard", path: "/admin" },
    { name: "📦 Objednávky", path: "/admin/objednavky" },
    { name: "📊 Statistika", path: "/admin/statistika" },
    { name: "📉 Náklady", path: "/admin/naklady" },
    { name: "🥚 Produkce vajec", path: "/admin/produkcevajec" },
  ];

  return (
    <div className="flex min-h-screen font-sans bg-gray-50">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg rounded-r-lg p-6 flex flex-col">
        {/* Logo farmy */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src="/logo-farmy.png"
            alt="Farma Honezovice"
            className="h-16 w-auto"
          />
        </div>

        <nav className="flex flex-col space-y-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`p-3 rounded-md transition block text-left text-gray-700 font-medium
                  ${
                    router.pathname === item.path
                      ? "bg-green-600 text-white font-semibold shadow"
                      : "hover:bg-green-100 hover:text-green-700"
                  }`}
              >
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Hlavní obsah */}
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
