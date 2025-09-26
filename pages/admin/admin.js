import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === process.env.ADMIN_PASSWORD) {
      setIsLogged(true);
      fetchOrders();
    } else {
      setError("❌ Nesprávné heslo");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("pickup_date", { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setOrders(data);
    }
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ processed: !currentStatus })
      .eq("id", id);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, processed: !currentStatus } : o))
      );
    }
  };

  if (!isLogged) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
        <input
          type="password"
          placeholder="Heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded mb-2"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Přihlásit
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Seznam objednávek</h1>
      {loading ? (
        <p>Načítání...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Jméno</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Telefon</th>
              <th className="border px-2 py-1">Standard</th>
              <th className="border px-2 py-1">LowChol</th>
              <th className="border px-2 py-1">Datum vyzvednutí</th>
              <th className="border px-2 py-1">Místo</th>
              <th className="border px-2 py-1">Vyřízeno</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className={o.processed ? "bg-green-100" : ""}>
                <td className="border px-2 py-1">{o.id}</td>
                <td className="border px-2 py-1">{o.customer_name}</td>
                <td className="border px-2 py-1">{o.email}</td>
                <td className="border px-2 py-1">{o.phone}</td>
                <td className="border px-2 py-1">{o.standard_quantity}</td>
                <td className="border px-2 py-1">{o.low_chol_quantity}</td>
                <td className="border px-2 py-1">{o.pickup_date}</td>
                <td className="border px-2 py-1">{o.pickup_location}</td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => toggleStatus(o.id, o.processed)}
                    className={`px-2 py-1 rounded ${
                      o.processed ? "bg-green-500 text-white" : "bg-gray-300"
                    }`}
                  >
                    {o.processed ? "Ano" : "Ne"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
