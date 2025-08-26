import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Sidebar() {
  const router = useRouter();

  const links = [
    { href: '/', label: 'Úvod' },
    { href: '/objednavka', label: 'Objednávka vajec' },
    { href: '/o-farme', label: 'O farmě' },
    { href: '/kontakt', label: 'Kontakt' },
  ];

  return (
    <div className="w-64 bg-green-700 text-white p-6 space-y-4 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Menu</h2>
      <nav className="flex flex-col space-y-3">
        {links.map(link => (
          <Link key={link.href} href={link.href} className={`px-3 py-2 rounded hover:bg-green-600 transition ${router.pathname === link.href ? 'bg-green-800' : ''}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
