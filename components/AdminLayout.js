import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAdminAuth } from "./AdminAuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { authenticated, ready, login, logout } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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
    { name: "🥚 Předobjednávky", path: "/admin/predobjednavky" }, // nová položka
    { name: "📊 Statistika", path: "/admin/statistika" },
    { name: "📉 Náklady", path: "/admin/naklady" },
    { name: "🥚 Produkce vajec", path: "/admin/produkcevajec" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Boční panel (desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r p-6 flex-col">
        <div className="flex items-center mb-6">
          <img src="/logo.png" className="w-12 h-12 mr-3 object-contain" alt="Logo" />
          <div>
            <div className="text-lg font-bold">Farma Honezovice</div>
            <div className="text-sm text-gray-500">Admin</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((it) => (
            <Link
              key={it.path}
              href={it.path}
              className={`p-2 rounded ${
                router.pathname === it.path
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
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

      {/* Mobilní menu tlačítko */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMenuOpen(true)}
          className="bg-white border p-2 rounded shadow"
          aria-label="Otevřít menu"
        >
          ☰
        </button>
      </div>

      {/* Mobilní menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMenuOpen(false)}>
          <aside
            className="absolute left-0 top-0 w-64 bg-white h-full p-6 shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <img src="/logo.png" className="w-10 h-10 mr-2 object-contain" alt="Logo" />
                <div>
                  <div className="text-lg font-bold">Farma Honezovice</div>
                  <div className="text-sm text-gray-500">Admin</div>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-gray-600 text-2xl"
                aria-label="Zavřít menu"
              >
                ✖
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {menuItems.map((it) => (
                <Link
                  key={it.path}
                  href={it.path}
                  onClick={() => setMenuOpen(false)}
                  className={`p-2 rounded ${
                    router.pathname === it.path
                      ? "bg-green-100 text-green-700 font-semibold"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
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
        </div>
      )}

      {/* Obsah stránky */}
      <main className="flex-1 p-6 md:ml-0">{children}</main>
    </div>
  );
}
