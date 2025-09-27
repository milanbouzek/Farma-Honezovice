import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import StockBox from "../../components/StockBox";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";
const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

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

  useEffect(() => {
    if (authenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

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

  const renderSection = (statusLabel, color, hideIfEmpty = false) => {
    const sectionOrders = orders.filter((o) => o.status === statusLabel);
    if (!sectionOrders.length && hideIfEmpty) return null;

    const sectionTitle = statusLabel.toUpperCase();
    return (
      <div className="mb-6 border rounded-xl p-4 bg-white shadow">
        <h2 className="text-xl font-bold mb-2" style={{ color }}>
          {sectionTitle}
        </h2>
        {sectionOrders.length === 0 ? (
          <p className="italic text-gray-500">Žádné objednávky</p>
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
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50"
                    style={{
                      backgroundColor:
                        order.status === "nová objednávka"
                          ? "#fee2e2"
                          : order.status === "zpracovává se"
                          ? "#fef9c3"
                          : "#d1fae5",
                    }}
                  >
                    <td className="p-2">{order.id}</td>
                    <td className="p-2">{order.customer_name}</td>
                    <td className="p-2">{order.email || "-"}</td>
                    <td className="p-2">{order.phone || "-"}</td>
                    <td className="p-2">{order.standard_quantity}</td>
                    <td className="p-2">{order.low_chol_quantity}</td>
                    <td className="p-2">{order.pickup_location}</td>
                    <td className="p-2">{order.pickup_date}</td>
                    <td className="p-2">
                      {order.status !== STATUSES[STATUSES.length - 1] && (
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

  const completedOrders = orders.filter(
    (o) => o.status === "vyřízená" || o.status === "zrušená"
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Seznam objednávek</h1>

      {/* Stav skladu */}
      <StockBox />

      {/* Sekce nová */}
      {renderSection("nová objednávka", "red", true)}

      {/* Sekce zpracovává se */}
      {renderSection("zpracovává se", "orange", true)}

      {/* Sekce vyřízené / zrušené s rozklikem */}
      <div className="mb-6 border rounded-xl p-4 bg-white shadow">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-left w-full font-bold text-green-700"
        >
          {showCompleted ? "▼ Dokončené a zrušené objednávky" : "► Dokončené a zrušené objednávky"}
        </button>
        {showCompleted && completedOrders.length > 0 && (
          <div className="overflow-x-auto mt-2">
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
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 bg-green-100">
                    <td className="p-2">{order.id}</td>
                    <td className="p-2">{order.customer_name}</td>
                    <td className="p-2">{order.email || "-"}</td>
                    <td className="p-2">{order.phone || "-"}</td>
                    <td className="p-2">{order.standard_quantity}</td>
                    <td className="p-2">{order.low_chol_quantity}</td>
                    <td className="p-2">{order.pickup_location}</td>
                    <td className="p-2">{order.pickup_date}</td>
                    <td className="p-2">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showCompleted && completedOrders.length === 0 && <p className="italic text-gray-500 mt-2">Žádné objednávky</p>}
      </div>
    </div>
  );
}
