import { useState, useEffect } from "react";
import { supabaseServer } from "../../lib/supabaseServerClient";
import toast, { Toaster } from "react-hot-toast";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

const STATUS_FLOW = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchOrders();
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      toast.error("Chyba při načítání objednávek: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (order) => {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return;

    const newStatus = STATUS_FLOW[currentIndex + 1];

    try {
      const { error } = await supabaseServer
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);
      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
      toast.success(`✅ Status objednávky změněn na: ${newStatus}`);
    } catch (err) {
      toast.error("Chyba při aktualizaci statusu: " + err.message);
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

  const sections = [
    { title: "Nové objednávky", status: ["nová objednávka"], color: "red-500" },
    { title: "Zpracovává se", status: ["zpracovává se"], color: "yellow-400" },
    { title: "Vyřízené / Zrušené", status: ["vyřízená", "zrušená"], color: "green-500" },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Seznam objednávek</h1>

      {loading ? (
        <p>Načítám objednávky...</p>
      ) : (
        sections.map((section) => {
          const filteredOrders = orders.filter((o) => section.status.includes(o.status));
          if (filteredOrders.length === 0) return null;

          return (
            <div key={section.title} className="mb-8">
              <h2 className={`text-xl font-bold mb-2 text-${section.color}`}>{section.title}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Jméno</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Telefon</th>
                      <th className="p-2 text-left">Standard</th>
                      <th className="p-2 text-left">LowChol</th>
                      <th className="p-2 text-left">Místo</th>
                      <th className="p-2 text-left">Datum</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{order.id}</td>
                        <td className="p-2">{order.customer_name}</td>
                        <td className="p-2">{order.email || "-"}</td>
                        <td className="p-2">{order.phone || "-"}</td>
                        <td className="p-2">{order.standard_quantity}</td>
                        <td className="p-2">{order.low_chol_quantity}</td>
                        <td className="p-2">{order.pickup_location}</td>
                        <td className="p-2">{order.pickup_date}</td>
                        <td className="p-2 font-semibold">{order.status}</td>
                        <td className="p-2">
                          {STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && (
                            <button
                              onClick={() => advanceStatus(order)}
                              className={`bg-${section.color} text-white px-2 py-1 rounded hover:opacity-80`}
                            >
                              Posunout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
