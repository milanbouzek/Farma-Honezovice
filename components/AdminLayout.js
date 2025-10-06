import Link from "next/link";
import { useRouter } from "next/router";
import { useAdminAuth } from "./AdminAuthContext";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { authenticated, login, logout } = useAdminAuth();
  const [password, setPassword] = useState("");

  const menuItems = [
    { name: "🏠 Dashboard", path: "/admin" },
    { name: "📦 Objednávky", path: "/admin/objednavky" },
    { name: "📊 Statistika", path: "/admin/statistika" },
    { name: "📉 Náklady", path: "/admin/naklady" },
    { name: "🥚 Produkce vajec", path: "/admin/produkcevajec" },
  ];

  const handleLogin = () => {
    if (!password) {
      toast.error("Zadej heslo");
      return;
    }
    login(password);
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf7f2]">
        <Toaster position="top-center" />
        <img
          src="/logo.png"
          alt="Logo Farmy"
          className="w-32 h-auto mb-6 rounded-lg shadow"
        />
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Přihlášení do administrace
        </h1>
        <input
          type="password"
          placeholder="Zadejte heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 p-2 rounded mb-3 w-64 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={handleLogin}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#faf7f2] text-gray-800">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-col items-center mb-8">
            <img
              src="/logo.png"
              alt="Logo Farmy"
              className="w-28 h-auto mb-3 rounded-lg"
            />
            <h1 className="text-lg font-bold text-green-800">Farma Hněvošice</h1>
          </div>

          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`block px-3 py-2 rounded-md transition text-sm font-medium ${
                    router.pathname === item.path
                      ? "bg-green-600 text-white"
                      : "hover:bg-green-100"
                  }`}
                >
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
        </div>

        <button
          onClick={logout}
          className="mt-8 w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition text-sm"
        >
          Odhlásit se
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
