import Link from "next/link";
import { useState } from "react";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col md:flex-row">
      {/* Horní lišta pro mobily */}
      <header className="md:hidden bg-green-700 text-white flex justify-between items-center p-4">
        <img
          src="/logo.png"
          alt="Farma Honezovice logo"
          className="h-10 w-auto"
        />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white focus:outline-none text-2xl"
        >
          ☰
        </button>
      </header>

      {/* Boční menu */}
      <aside
        className={`${
          menuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-green-700 text-white p-6 space-y-6`}
      >
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Farma Honezovice logo"
            className="h-28 w-auto"
          />
        </div>
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
