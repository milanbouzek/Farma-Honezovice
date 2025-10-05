import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  // Při načtení stránky zkontrolujeme, zda už je uživatel přihlášen
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

  // Dynamické menu – pokud přidáš další stránku, stačí přidat do pole
  const menuItems = [
    { href: "/admin", label: "Objednávky", color: "blue" },
    { href: "/admin/statistika", label: "Statistika", color: "green" },
    { href: "/admin/naklady", label: "Náklady", color: "red" },
    { href: "/admin/produkcevajec", label: "Produkce vajec", color: "purple" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-center" />
      <header className="mb-6">
        <nav className="flex gap-4 flex-wrap">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`px-3 py-1 bg-${item.color}-500 text-white rounded hover:bg-${item.color}-600`}
              >
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
