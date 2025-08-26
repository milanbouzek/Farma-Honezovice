import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Levé menu */}
      <aside className="w-64 bg-green-700 text-white p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-6">Farma Honezovice</h2>
        <nav className="space-y-2">
          <Link href="/" className="block hover:bg-green-600 p-2 rounded">
            Úvod
          </Link>
          <Link href="/o-farme" className="block hover:bg-green-600 p-2 rounded">
            O farmě
          </Link>
          <Link href="/objednavka" className="block hover:bg-green-600 p-2 rounded">
            Objednávka vajec
          </Link>
        </nav>
      </aside>

      {/* Obsah stránky */}
      <main className="flex-1 bg-yellow-50 p-8">{children}</main>
    </div>
  );
}
