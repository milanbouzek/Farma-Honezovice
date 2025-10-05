import { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminAuthContext } from "../context/AdminAuthContext";
import { Toaster, toast } from "react-hot-toast";

export default function AdminLayout({ children }) {
  const { authenticated, login } = useContext(AdminAuthContext);
  const [password, setPassword] = useState("");

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <div className="mb-6 flex items-center justify-center">
          <Image src="/logo.png" alt="Farma logo" width={150} height={60} />
        </div>
        <nav className="flex flex-col space-y-2 flex-1">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path} legacyBehavior>
              <a
                className={`p-2 rounded-md transition ${
                  typeof window !== "undefined" && window.location.pathname === item.path
                    ? "bg-yellow-100 font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Hlavní obsah */}
      <main className="flex-1 p-6">{children}</main>
      <Toaster position="top-center" />
    </div>
  );
}
