import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <nav className="flex gap-4">
          <Link href="/admin">
            <a className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Objednávky</a>
          </Link>
          <Link href="/admin/statistika">
            <a className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Statistika</a>
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
