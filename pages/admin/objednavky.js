import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";
import OrdersTable from "../../components/OrdersTable";

export default function OrdersPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

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
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchOrders();
    } else {
      toast.error("❌ Špatné heslo");
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

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📦 Seznam objednávek</h1>
      <StockBox editable={true} />
      <div className="bg-white shadow rounded-xl p-4">
        {loading ? <p>Načítám objednávky…</p> : <OrdersTable orders={orders} refreshOrders={fetchOrders} />}
      </div>
    </AdminLayout>
  );
}
