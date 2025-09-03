import Link from "next/link";
import { useState } from "react";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col md:flex-row">
      {/* Horní lišta pro mobily */}
      <header className="md:hidden bg-green-700 text-white flex justify-between items-center p-4">
        <h2 className="text-xl font-bold">Farma Honezovice</h2>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white focus:outline-none"
        >
          ☰
        </button>
      </header>

      {/* Boční menu */}
      <aside
        className={`${
          menuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-green-700 text-white p-6 space-y-4`}
      >
        <h2 className="text-2xl font-bold mb-6 hidden md:block">
          Farma Honezovice
        </h2>
        <nav className="space-y-2">
          <Link href="/" className="block hover:bg-green-600 p-2 rounded">
            Úvod
          </Link>
          <Link href="/o-farme" className="block hover:bg-green-600 p-2 rounded">
            O farmě
          </Link>
          <Link
            href="/objednavka"
            className="block hover:bg-green-600 p-2 rounded"
          >
            Objednávka vajec
          </Link>
          <Link href="/novinky" className="block hover:bg-green-600 p-2 rounded">
            Novinky
          </Link>
          <Link
            href="/podminky-prodeje"
            className="block hover:bg-green-600 p-2 rounded"
          >
            Podmínky prodeje
          </Link>
        </nav>
      </aside>

      {/* Obsah stránky */}
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
