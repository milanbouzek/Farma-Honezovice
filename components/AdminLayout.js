import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  // Kontrola přihlášení při načtení
  useEffect(() => {
    const saved = localStorage.getItem("admin_authenticated");
    if (saved === "true") setAuthenticated(true);
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

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
        <input
          type="password"
          placeholder="Zadejte heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded mb-2 w-64 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={handleLogin}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
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
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="flex justify-center items-center py-6 border-b border-gray-200">
          <img src="/logo.png" alt="Farma" className="h-16 w-auto" />
        </div>

        {/* Navigace */}
        <nav className="flex flex-col mt-4 px-2 flex-1">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center p-3 mb-2 rounded-lg transition-all ${
                  router.pathname === item.path
                    ? "bg-green-600 text-white font-semibold shadow-md"
                    : "text-gray-700 hover:bg-green-100 hover:text-green-800"
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
