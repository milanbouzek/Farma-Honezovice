import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // ⬅️ nový stav
  const [password, setPassword] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  // ✅ Ověření uloženého přihlášení
  useEffect(() => {
    const saved = localStorage.getItem("admin_authenticated");
    if (saved === "true") {
      setAuthenticated(true);
    }
    setCheckingAuth(false); // dokončeno ověřování
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

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
    toast("👋 Odhlášeno");
  };

  // ⏳ Zobrazení pouze po načtení ověření
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600">
        Načítání...
      </div>
    );
  }

  // 🔒 Přihlašovací obrazovka
  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Toaster position="top-center" />
        <div className="bg-white p-8 rounded-2xl shadow-md w-80 text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto mb-4 w-24" />
          <h1 className="text-xl font-semibold mb-4">Admin přihlášení</h1>
          <input
            type="password"
            placeholder="Zadejte heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full mb-3 focus:ring-2 focus:ring-green-400 outline-none"
          />
          <button
            onClick={handleLogin}
            className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 transition"
          >
            Přihlásit se
          </button>
        </div>
      </div>
    );
  }

  // 🧭 Sidebar menu položky
  const menuItems = [
    { name: "🏠 Dashboard", path: "/admin" },
    { name: "📦 Objednávky", path: "/admin/objednavky" },
    { name: "📊 Statistika", path: "/admin/statistika" },
    { name: "🥚 Produkce vajec", path: "/admin/produkcevajec" },
    { name: "💰 Náklady", path: "/admin/naklady" },
  ];

  // ✅ Hlavní layout po přihlášení
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center mb-8">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 mr-3" />
            <h2 className="text-xl font-bold text-gray-700">Farma Honezovice</h2>
          </div>
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`p-2 rounded-md text-sm font-medium transition ${
                  router.pathname === item.path
                    ? "bg-green-100 text-green-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 bg-red-100 text-red-600 py-2 rounded-md hover:bg-red-200 transition"
        >
          Odhlásit se
        </button>
      </aside>

      {/* Obsah */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
