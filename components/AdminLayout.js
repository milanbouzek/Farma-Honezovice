import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminAuth } from "./AdminAuthContext";

export default function AdminLayout({ children }) {
  const { authenticated, login } = useAdminAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const result = login(password);
    if (result.success) toast.success("✅ Přihlášeno!");
    else toast.error("❌ Špatné heslo");
    setPassword("");
  };

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

  const menuItems = [
    { name: "🏠 Dashboard", path: "/admin" },
    { name: "📦 Objednávky", path: "/admin/objednavky" },
    { name: "📊 Statistika", path: "/admin/statistika" },
    { name: "📉 Náklady", path: "/admin/naklady" },
    { name: "🥚 Produkce vajec", path: "/admin/produkcevajec" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-50 shadow-md p-4">
        <img src="/logo.png" alt="Farma logo" className="w-40 mb-6" />
        <nav className="flex flex-col space-y-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`p-2 rounded-md transition block ${
                  router.pathname === item.path
                    ? "bg-green-600 text-white font-semibold"
                    : "hover:bg-gray-200 text-gray-800"
                }`}
              >
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
