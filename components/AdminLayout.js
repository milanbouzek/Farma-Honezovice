import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAdminAuth } from "../context/AdminAuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { authenticated, login } = useAdminAuth();
  const [password, setPassword] = useState("");

  const menuItems = [
    { name: "🏠 Dashboard", path: "/admin" },
    { name: "📦 Objednávky", path: "/admin/objednavky" },
    { name: "📊 Statistika", path: "/admin/statistika" },
    { name: "📉 Náklady", path: "/admin/naklady" },
    { name: "🥚 Produkce vajec", path: "/admin/produkcevajec" },
  ];

  const handleLogin = () => {
    if (login(password)) {
      toast.success("✅ Přihlášeno!");
      setPassword("");
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Toaster position="top-center" />
        <img src="/logo.png" alt="Farma" className="w-32 mb-4" />
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col">
        <img src="/logo.png" alt="Farma" className="w-32 mb-6 mx-auto" />
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`p-2 rounded-md transition text-gray-700 ${
                  router.pathname === item.path
                    ? "bg-green-500 text-white font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Obsah */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
