import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";
import OrdersTable from "../../components/OrdersTable";

export default function OrdersPage() {
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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Rozdělení podle statusu
  const newOrders = orders.filter((o) => o.status === "nová objednávka");
  const processingOrders = orders.filter((o) => o.status === "zpracovává se");
  const completedOrders = orders.filter(
    (o) => o.status === "vyřízená" || o.status === "zrušená"
  );

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📦 Seznam objednávek</h1>

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
              <OrdersTable orders={newOrders} refreshOrders={fetchOrders} />
            </div>
          )}

          {processingOrders.length > 0 && (
            <div className="mb-6 border rounded-xl p-4 bg-white shadow">
              <h2 className="text-xl font-bold mb-2 text-yellow-600">ZPRACOVÁVÁ SE</h2>
              <OrdersTable orders={processingOrders} refreshOrders={fetchOrders} />
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
            {showCompleted && completedOrders.length > 0 && (
              <div className="mt-2">
                <OrdersTable orders={completedOrders} refreshOrders={fetchOrders} />
              </div>
            )}
            {showCompleted && completedOrders.length === 0 && (
              <p className="italic text-gray-500 mt-2">Žádné objednávky</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
