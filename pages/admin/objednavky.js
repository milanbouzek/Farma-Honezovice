import { useEffect, useContext, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";
import OrdersTable from "../../components/OrdersTable";
import { AdminAuthContext } from "../../components/AdminAuthContext";

export default function OrdersPage() {
  const { authenticated } = useContext(AdminAuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    if (!authenticated) return;
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
    if (authenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000); // každých 10s
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <p className="text-xl text-gray-600">Pro zobrazení této stránky se musíte přihlásit v admin panelu.</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📦 Seznam objednávek</h1>

      <StockBox editable={true} />

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
