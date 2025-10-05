import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { AdminAuthContext } from "../contexts/AdminAuthContext";

export default function AdminLayout({ children }) {
  const { authenticated } = useContext(AdminAuthContext);
  const router = useRouter();

  const menuItems = [
    { name: "🏠 Dashboard", path: "/admin" },
    { name: "📦 Objednávky", path: "/admin/objednavky" },
    { name: "📊 Statistika", path: "/admin/statistika" },
    { name: "📉 Náklady", path: "/admin/naklady" },
    { name: "🥚 Produkce vajec", path: "/admin/produkcevajec" },
  ];

  if (!authenticated) {
    // Pokud uživatel není přihlášen, nepokračujeme
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <div className="flex items-center mb-6">
          <Image src="/logo.png" alt="Farma Logo" width={48} height={48} />
          <span className="ml-2 text-xl font-bold">Farma</span>
        </div>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`p-2 rounded-md transition-colors ${
                  router.pathname === item.path
                    ? "bg-green-500 text-white font-semibold"
                    : "hover:bg-green-100 text-gray-800"
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
