import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Funkce pro zvýraznění aktivní položky
  const linkClass = (path) =>
    `block p-2 rounded hover:bg-green-600 ${
      router.pathname === path ? "bg-green-600 font-semibold" : ""
    }`;

  return (
    <div className="min-h-screen relative flex flex-col md:flex-row">
      {/* Pozadí s obrázkem */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/Slepice-pozadi.PNG')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      ></div>

      {/* Overlay pro čitelnost obsahu */}
      <div className="absolute inset-0 bg-white bg-opacity-70"></div>

      {/* Obsah */}
      <div className="relative z-10 flex flex-col md:flex-row flex-1">
        {/* Horní lišta pro mobily */}
        <header className="md:hidden bg-green-700 text-white flex justify-between items-center p-4">
          <div className="bg-white rounded-xl p-1">
            <Image
              src="/logo.png"
              alt="Farma Honezovice"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
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
          } md:block w-full md:w-64 bg-green-700 bg-opacity-95 text-white p-6 space-y-6`}
        >
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-xl p-2">
              <Image
                src="/logo.png"
                alt="Farma Honezovice"
                width={160}
                height={160}
                className="object-contain"
              />
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/" className={linkClass("/")}>
              Úvod
            </Link>
            <Link href="/o-farme" className={linkClass("/o-farme")}>
              O farmě
            </Link>
            <Link href="/objednavka" className={linkClass("/objednavka")}>
              Objednávka vajec
            </Link>

            {/* 🥚 Nová položka */}
            <Link
              href="/predobjednavka"
              className={linkClass("/predobjednavka")}
            >
              🥚 Předobjednávka
            </Link>

            <Link href="/novinky" className={linkClass("/novinky")}>
              Novinky
            </Link>
            <Link href="/podminky-prodeje" className={linkClass("/podminky-prodeje")}>
              Podmínky prodeje
            </Link>
          </nav>
        </aside>

        {/* Obsah stránky */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
