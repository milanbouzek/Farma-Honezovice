import { useState } from "react";
import { useRouter } from "next/router";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      // uložíme stav do sessionStorage
      sessionStorage.setItem("admin_logged_in", "true");
      router.push("/admin/orders");
    } else {
      setError("❌ Nesprávné heslo");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Admin přihlášení</h2>
        <input
          type="password"
          placeholder="Heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-xl p-2 mb-4"
        />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-xl font-semibold">
          Přihlásit se
        </button>
      </form>
    </div>
  );
}
