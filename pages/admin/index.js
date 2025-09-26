import { useState, useEffect } from "react";
import { supabaseServer } from "../../lib/supabaseServerClient";
import toast, { Toaster } from "react-hot-toast";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

const STATUS_ORDER = ["Nová objednávka", "Zpracovává se", "Vyřízená", "Zrušená"];
const COLOR_MAP = {
  "Nová objednávka": "text-red-600",
  "Zpracovává se": "text-yellow-500",
  "Vyřízená": "text-green-600",
  "Zrušená": "text-green-600",
};
const BUTTON_COLOR_MAP = {
  "Nová objednávka": "bg-red-500",
  "Zpracovává se": "bg-yellow-400",
  "Vyřízená": "bg-green-500",
  "Zrušená": "bg-green-500",
};

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
      setOrders(data);
    } catch (err) {
      toast.error("Chyba při načítání objednávek: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (order) => {
    const currentIndex = STATUS_ORDER.indexOf(order.status);
    if (currentIndex === -1 || currentIndex === STATUS_ORDER.length - 1) return;
    const newStatus = STATUS_ORDER[currentIndex + 1];

    try {
      const { error } = await supabaseServer
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
      toast.success(`✅ Status změněn na "${newStatus}"`);
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

  // Rozdělení objednávek podle statusu
  const sections = [
    { title: "Nová objednávka", orders: orders.filter(o => o.status === "Nová objednávka") },
    { title: "Zpracovává se", orders: orders.filter(o => o.status === "Zpracovává se") },
    { title: "Vyřízená / Zrušená", orders: orders.filter(o => o.status === "Vyřízená" || o.status === "Zrušená") },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Seznam objednávek</h1>

      {loading ? (
        <p>Načítám objednávky...</p>
      ) : orders.length === 0 ? (
        <p>Žádné objednávky.</p>
      ) : (
        sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className={`text-xl font-bold mb-4 ${COLOR_MAP[section.title]}`}>
              {section.title}
            </h2>
            {section.orders.length === 0 ? (
              <p>Žádné objednávky v této sekci.</p>
            ) : (
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
                    {section.orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{order.id}</td>
                        <td className="p-2">{order.customer_name}</td>
                        <td className="p-2">{order.email || "-"}</td>
                        <td className="p-2">{order.phone || "-"}</td>
                        <td className="p-2">{order.standard_quantity}</td>
                        <td className="p-2">{order.low_chol_quantity}</td>
                        <td className="p-2">{order.pickup_location}</td>
                        <td className="p-2">{order.pickup_date}</td>
                        <td className="p-2">
                          <span className={`${COLOR_MAP[order.status]} font-semibold`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-2">
                          {order.status !== "Vyřízená" && order.status !== "Zrušená" && (
                            <button
                              onClick={() => advanceStatus(order)}
                              className={`${BUTTON_COLOR_MAP[order.status]} text-white px-2 py-1 rounded hover:opacity-80`}
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
            )}
          </div>
        ))
      )}
    </div>
  );
}
