import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const menuItems = [
    { name: "Objednávky", path: "/admin/objednavky" },
    { name: "Statistika", path: "/admin/statistika" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 text-white p-4 flex gap-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`px-3 py-1 rounded ${
              router.pathname === item.path ? "bg-gray-700" : "bg-gray-600"
            }`}
          >
            {item.name}
          </button>
        ))}
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
