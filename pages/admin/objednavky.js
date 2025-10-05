import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";
import OrdersTable from "../../components/OrdersTable";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📦 Seznam objednávek</h1>

      {/* 🔹 Panel se stavem a cenou vajec (editovatelný) */}
      <div className="mb-6">
        <StockBox editable={true} />
      </div>

      {/* 🔹 Tabulka objednávek */}
      <div className="bg-white shadow rounded-xl p-4">
        {loading ? (
          <p>Načítám objednávky…</p>
        ) : (
          <OrdersTable orders={orders} refreshOrders={fetchOrders} />
        )}
      </div>
    </AdminLayout>
  );
}
