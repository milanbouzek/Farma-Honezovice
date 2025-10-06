import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";
import OrdersTable from "../../components/OrdersTable";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

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

  // obnovuje seznam objednávek každých 10 sekund
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📦 Seznam objednávek</h1>

      {/* Box se stavem skladu */}
      <StockBox editable={true} />

      {/* Tabulka objednávek */}
      <div className="bg-white shadow rounded-xl p-4 mt-4">
        {loading ? (
          <p>Načítám objednávky…</p>
        ) : (
          <OrdersTable orders={orders} refreshOrders={fetchOrders} />
        )}
      </div>
    </AdminLayout>
  );
}
