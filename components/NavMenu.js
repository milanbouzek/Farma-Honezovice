import Link from "next/link";

export default function NavMenu() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex gap-4">
      <Link href="/admin" className="hover:underline">
        Objednávky
      </Link>
      <Link href="/admin/statistika" className="hover:underline">
        Statistika
      </Link>
    </nav>
  );
}
