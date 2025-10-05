import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

export default function AdminLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      toast.success("✅ Přihlášeno!");
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
        <input
          type="password"
          placeholder="Zadejte heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded mb-2 w-64"
        />
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-center" />
      <header className="mb-6">
        <nav className="flex gap-4">
          <Link href="/admin">
            <a className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Objednávky</a>
          </Link>
          <Link href="/admin/statistika">
            <a className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Statistika</a>
          </Link>
          <Link href="/admin/naklady">
            <a className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Náklady</a>
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
