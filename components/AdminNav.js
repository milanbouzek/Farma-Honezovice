import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminNav() {
  const router = useRouter();

  const links = [
    { href: "/admin/objednavky", label: "📦 Objednávky" },
    { href: "/admin/statistika", label: "📊 Statistika" },
  ];

  return (
    <nav className="flex gap-6 mb-6 bg-white shadow p-4 rounded-lg">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-2 rounded ${
            router.pathname === href
              ? "bg-blue-500 text-white"
              : "text-blue-600 hover:bg-blue-100"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
