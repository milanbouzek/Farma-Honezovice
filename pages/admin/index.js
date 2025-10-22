import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";
import OrdersTable from "../../components/OrdersTable";

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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // --------------------------
  // 📌 Změna statusu objednávky
  // --------------------------
  const handleStatusChange = async (orderId) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST", // stejná metoda jako v objednavky.js
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Chyba při změně statusu");
      }

      toast.success("Status objednávky byl změněn ✅");
      fetchOrders();
    } catch (err) {
      toast.error("Chyba při změně statusu: " + err.message);
    }
  };

  // --------------------------
  // 📌 Změna zaplacení objednávky
  // --------------------------
  const handlePaymentChange = async (orderId, paid) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Chyba při změně platby");
      }

      toast.success("Platba byla úspěšně změněna ✅");
      fetchOrders();
    } catch (err) {
      toast.error("Chyba při změně platby: " + err.message);
    }
  };

  // --------------------------
  // 📌 Vynulování ceny objednávky
  // --------------------------
  const handleResetPrice = async (orderId) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reset-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Chyba při vynulování ceny");
      }

      toast.success("Cena byla úspěšně vynulována 💰");
      fetchOrders();
    } catch (err) {
      toast.error("Chyba při vynulování ceny: " + err.message);
    }
  };

  // --------------------------
  // 📌 Rozdělení objednávek podle statusu
  // --------------------------
  const newOrders = orders.filter((o) => o.status === "nová objednávka");
  const processingOrders = orders.filter((o) => o.status === "zpracovává se");
  const completedOrders = orders.filter(
    (o) => o.status === "vyřízená" || o.status === "zrušená"
  );

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Přehled objednávek</h1>

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
              <OrdersTable
                orders={newOrders}
                refreshOrders={fetchOrders}
                onStatusChange={handleStatusChange}
                onPaymentChange={handlePaymentChange}
                onResetPrice={handleResetPrice}
              />
            </div>
          )}

          {processingOrders.length > 0 && (
            <div className="mb-6 border rounded-xl p-4 bg-white shadow">
              <h2 className="text-xl font-bold mb-2 text-yellow-600">ZPRACOVÁVÁ SE</h2>
              <OrdersTable
                orders={processingOrders}
                refreshOrders={fetchOrders}
                onStatusChange={handleStatusChange}
                onPaymentChange={handlePaymentChange}
                onResetPrice={handleResetPrice}
              />
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
                <OrdersTable
                  orders={completedOrders}
                  refreshOrders={fetchOrders}
                  onStatusChange={handleStatusChange}
                  onPaymentChange={handlePaymentChange}
                  onResetPrice={handleResetPrice}
                />
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
