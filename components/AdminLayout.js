// components/AdminLayout.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAdminAuth } from "./AdminAuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { authenticated, ready, login, logout } = useAdminAuth();
  const [password, setPassword] = useState("");

  // pokud ještě nevíme (čekáme na localStorage), zobrazíme načítání
  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen">Načítání…</div>;
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <div className="bg-white p-6 rounded-xl shadow-md w-80 text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto mb-4 w-24 h-24 object-contain" />
          <h2 className="text-xl font-semibold mb-4">Admin přihlášení</h2>
          <input
            type="password"
            placeholder="Zadejte heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          <button
            onClick={() => {
              const res = login(password);
              if (res.success) toast.success("✅ Přihlášeno");
              else toast.error(res.message || "❌ Špatné heslo");
            }}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Přihlásit se
          </button>
        </div>
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
      <aside className="w-64 bg-white border-r p-6">
        <div className="flex items-center mb-6">
          <img src="/logo.png" className="w-12 h-12 mr-3 object-contain" alt="Logo" />
          <div>
            <div className="text-lg font-bold">Farma Honezovice</div>
            <div className="text-sm text-gray-500">Admin</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((it) => (
            <Link key={it.path} href={it.path} className={`p-2 rounded ${router.pathname === it.path ? "bg-green-100 text-green-700 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
              {it.name}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <button onClick={logout} className="w-full bg-red-100 text-red-600 py-2 rounded">
            Odhlásit se
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
