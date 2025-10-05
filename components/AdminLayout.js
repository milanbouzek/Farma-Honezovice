import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(null); // null = loading
  const [password, setPassword] = useState("");
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("admin_authenticated");
    if (saved === "true") setAuthenticated(true);
    else setAuthenticated(false);
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

  // Prevence flashu: zatím nic nerenderujeme
  if (authenticated === null) return null;

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
          className="border p-2 rounded mb-2 w-64"
        />
        <button
          onClick={handleLogin}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col">
        {/* Logo farmy */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src="/logo-farmy.png" // uprav cestu dle svého loga
            alt="Farma Honezovice"
            className="h-16 w-auto"
          />
        </div>

        <nav className="flex flex-col space-y-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`p-2 rounded-md transition block text-left ${
                  router.pathname === item.path
                    ? "bg-green-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
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
