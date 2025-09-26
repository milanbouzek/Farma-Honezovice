import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

const STATUS_SECTIONS = [
  { label: "nová objednávka", color: "#F87171" },    // červená
  { label: "zpracovává se", color: "#FBBF24" },      // žlutá
  { label: "vyřízená", color: "#34D399" },          // zelená
  { label: "zrušená", color: "#34D399" },           // zelená
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders);
    } catch (err) {
      toast.error("Chyba při načítání objednávek: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchOrders();
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  const advanceStatus = async (id) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === data.id ? { ...o, status: data.status } : o))
      );
      toast.success("✅ Status změněn na: " + data.status);
    } catch (err) {
      toast.error("Chyba při změně statusu: " + err.message);
    }
  };

  const renderSection = ({ label, color }) => {
    const sectionOrders = orders.filter((o) => o.status === label);

    return (
      <div
        key={label}
        className="p-4 mb-6 rounded-lg shadow"
        style={{ backgroundColor: `${color}20` }}
      >
        <h2 className="text-xl font-bold mb-2" style={{ color }}>
          {label.toUpperCase()}
        </h2>
        {sectionOrders.length === 0 ? (
          <div className="text-gray-500 p-4 border rounded text-center">
            Žádné objednávky
          </div>
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
                  <th className="p-2 text-left">Akce</th>
                </tr>
              </thead>
              <tbody>
                {sectionOrders.map((order) => (
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
                      {order.status !== STATUS_SECTIONS[STATUS_SECTIONS.length - 1].label && (
                        <button
                          onClick={() => advanceStatus(order.id)}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Další stav
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
    );
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
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Seznam objednávek</h1>
      {loading ? (
        <p>Načítám objednávky...</p>
      ) : (
        STATUS_SECTIONS.map(renderSection)
      )}
    </div>
  );
}
