import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrdersAdmin() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // whitelist jen na tvůj email
  const allowedEmails = ["tvujemail@domena.com"];

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        if (!allowedEmails.includes(data.user.email)) {
          alert("❌ Nemáš oprávnění!");
          window.location.href = "/";
        } else {
          setUser(data.user);
        }
      } else {
        window.location.href = "/admin/login";
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setOrders(data);
    setLoading(false);
  }

  async function markDone(id) {
    await supabase.from("orders").update({ status: "done" }).eq("id", id);
    fetchOrders();
  }

  async function markPending(id) {
    await supabase.from("orders").update({ status: "pending" }).eq("id", id);
    fetchOrders();
  }

  if (!user) return <p>Kontrola přihlášení...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Správa objednávek</h1>
      <p className="mb-6">Přihlášen: {user.email}</p>

      {loading ? (
        <p>Načítám objednávky...</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Jméno</th>
              <th className="p-2 border">Standard</th>
              <th className="p-2 border">Low Chol</th>
              <th className="p-2 border">Datum</th>
              <th className="p-2 border">Místo</th>
              <th className="p-2 border">Stav</th>
              <th className="p-2 border">Akce</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className={o.status === "done" ? "bg-green-100" : "bg-white"}
              >
                <td className="p-2 border">{o.id}</td>
                <td className="p-2 border">{o.customer_name}</td>
                <td className="p-2 border">{o.standard_quantity}</td>
                <td className="p-2 border">{o.low_chol_quantity}</td>
                <td className="p-2 border">{o.pickup_date}</td>
                <td className="p-2 border">{o.pickup_location}</td>
                <td className="p-2 border font-semibold">
                  {o.status === "done" ? "✅ Vyřízeno" : "⏳ Čeká"}
                </td>
                <td className="p-2 border space-x-2">
                  {o.status === "done" ? (
                    <button
                      onClick={() => markPending(o.id)}
                      className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                    >
                      Vrátit
                    </button>
                  ) : (
                    <button
                      onClick={() => markDone(o.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Vyřídit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
