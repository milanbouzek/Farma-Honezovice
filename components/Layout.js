import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-green-50">
      
      {/* Levé menu – stejné pro všechny stránky */}
      <aside className="w-64 bg-green-700 text-white p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-6">Farma Honezovice</h2>
        <nav className="space-y-2">
          <Link href="/" className="block hover:bg-green-600 p-2">
            Úvod
          </Link>
          <Link href="/o-farme" className="block hover:bg-green-600 p-2">
            O farmě
          </Link>
          <Link href="/objednavka" className="block hover:bg-green-600 p-2">
            Objednávka vajec
          </Link>
          <Link href="/podminky-prodeje" className="block hover:bg-green-600 p-2">
            Podmínky prodeje
          </Link>
        </nav>
      </aside>

      {/* Obsah stránky */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
