import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import StockBox from "../../components/StockBox"; // pokud StockBox dáme do samostatného souboru

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";
const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

export default function AdminOrders() {
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

  useEffect(() => {
    if (authenticated) {
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

  const renderSection = (statusLabel, color) => {
    const sectionOrders = orders.filter((o) => o.status === statusLabel);
    return (
      <div className="mb-6 p-4 bg-white shadow rounded-xl">
        <h2 className="font-bold mb-2" style={{ color }}>
          {statusLabel.toUpperCase()} ({sectionOrders.length})
        </h2>
        {sectionOrders.length ? (
          <table className="min-w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th>ID</th>
                <th>Jméno</th>
                <th>Status</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {sectionOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td>{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.status}</td>
                  <td>
                    {order.status !== STATUSES[STATUSES.length - 1] && (
                      <button
                        onClick={() => advanceStatus(order.id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Další stav
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Žádné objednávky</p>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <StockBox />
      {loading ? <p>Načítám objednávky...</p> : (
        <>
          {renderSection("nová objednávka", "red")}
          {renderSection("zpracovává se", "orange")}
          {renderSection("vyřízená", "green")}
          {renderSection("zrušená", "green")}
        </>
      )}
    </AdminLayout>
  );
}
