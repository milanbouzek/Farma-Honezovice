import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";
import toast, { Toaster } from "react-hot-toast";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      toast.error("Chyba při načítání objednávek: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Změna stavu objednávky (opraveno)
  const advanceStatus = async (id) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Status objednávky byl změněn");
        fetchOrders();
      } else {
        toast.error("Chyba: " + (data.error || "Nelze změnit status"));
      }
    } catch (err) {
      toast.error("Chyba při změně statusu: " + err.message);
    }
  };

  // 🟡 Označení zaplaceno / nezaplaceno
  const togglePaid = async (id, currentValue) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !currentValue }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Změna uložena");
        fetchOrders();
      } else {
        toast.error("Chyba: " + (data.error || "Nelze změnit stav platby"));
      }
    } catch (err) {
      toast.error("Chyba při změně platby: " + err.message);
    }
  };

  // 🔵 Vynulování ceny
  const resetPrice = async (id) => {
    if (!confirm("Opravdu chceš vynulovat cenu této objednávky?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}/price`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Cena byla vynulována");
        fetchOrders();
      } else {
        toast.error("Chyba: " + (data.error || "Nelze vynulovat cenu"));
      }
    } catch (err) {
      toast.error("Chyba při vynulování ceny: " + err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderTable = (data, color) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Jméno</th>
            <th className="p-2 text-left">Telefon</th>
            <th className="p-2 text-left">Standard</th>
            <th className="p-2 text-left">LowChol</th>
            <th className="p-2 text-left">Místo</th>
            <th className="p-2 text-left">Datum</th>
            <th className="p-2 text-center">Zaplaceno</th>
            <th className="p-2 text-left">Cena</th>
            <th className="p-2 text-left">Akce</th>
          </tr>
        </thead>
        <tbody>
          {data.map((order) => (
            <tr
              key={order.id}
              style={{ backgroundColor: color }}
              className="border-b hover:bg-gray-50"
            >
              <td className="p-2">{order.id}</td>
              <td className="p-2">{order.customer_name}</td>
              <td className="p-2">{order.phone || "-"}</td>
              <td className="p-2 text-center">{order.standard_quantity}</td>
              <td className="p-2 text-center">{order.low_chol_quantity}</td>
              <td className="p-2">{order.pickup_location}</td>
              <td className="p-2">{order.pickup_date}</td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={order.paid}
                  onChange={() => togglePaid(order.id, order.paid)}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
              </td>
              <td className="p-2">{order.total_price ?? 0} Kč</td>
              <td className="p-2 space-x-2">
                {order.status !== "vyřízená" &&
                  order.status !== "zrušená" && (
                    <button
                      onClick={() => advanceStatus(order.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Další stav
                    </button>
                  )}
                <button
                  onClick={() => resetPrice(order.id)}
                  className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                >
                  Vynulovat cenu
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const newOrders = orders.filter((o) => o.status === "nová objednávka");
  const processingOrders = orders.filter((o) => o.status === "zpracovává se");
  const completedOrders = orders.filter(
    (o) => o.status === "vyřízená" || o.status === "zrušená"
  );

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📦 Přehled objednávek</h1>

      <StockBox editable={true} />

      {loading ? (
        <div className="bg-white shadow rounded-xl p-4 mt-4">
          <p>Načítám objednávky…</p>
        </div>
      ) : (
        <>
          {newOrders.length > 0 && (
            <div className="mb-6 border rounded-xl p-4 bg-white shadow">
              <h2 className="text-xl font-bold mb-2 text-red-600">NOVÉ</h2>
              {renderTable(newOrders, "#fee2e2")}
            </div>
          )}

          {processingOrders.length > 0 && (
            <div className="mb-6 border rounded-xl p-4 bg-white shadow">
              <h2 className="text-xl font-bold mb-2 text-yellow-600">ZPRACOVÁVÁ SE</h2>
              {renderTable(processingOrders, "#fef9c3")}
            </div>
          )}

          <div className="mb-6 border rounded-xl p-4 bg-white shadow">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-left w-full font-bold text-green-700"
            >
              {showCompleted
                ? "▼ Dokončené a zrušené objednávky"
                : "► Dokončené a zrušené objednávky"}
            </button>
            {showCompleted && completedOrders.length > 0 && renderTable(completedOrders, "#d1fae5")}
            {showCompleted && completedOrders.length === 0 && (
              <p className="italic text-gray-500 mt-2">Žádné objednávky</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
