import { useState, useEffect } from "react";
import { supabaseServer } from "../../lib/supabaseServerClient";
import toast, { Toaster } from "react-hot-toast";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

const STATUS_ORDER = ["new", "processing", "processed", "canceled"];
const STATUS_LABELS = {
  new: "Nová objednávka",
  processing: "Zpracovává se",
  processed: "Vyřízená",
  canceled: "Zrušená",
};
const STATUS_COLORS = {
  new: "bg-red-100",
  processing: "bg-yellow-100",
  processed: "bg-green-100",
  canceled: "bg-green-100",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchOrders();
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      setOrders(data);
    } catch (err) {
      toast.error("Chyba při načítání objednávek: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (order) => {
    const currentIndex = STATUS_ORDER.indexOf(order.status);
    const nextStatus =
      currentIndex < STATUS_ORDER.length - 1
        ? STATUS_ORDER[currentIndex + 1]
        : order.status;

    try {
      const { error } = await supabaseServer
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", order.id);
      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o))
      );
      toast.success(`✅ Status změněn na: ${STATUS_LABELS[nextStatus]}`);
    } catch (err) {
      toast.error("Chyba při aktualizaci objednávky: " + err.message);
    }
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

  const ordersBySection = {
    new: orders.filter((o) => o.status === "new"),
    processing: orders.filter((o) => o.status === "processing"),
    done: orders.filter((o) => o.status === "processed" || o.status === "canceled"),
  };

  const renderTable = (ordersArray) => (
    <table className="min-w-full bg-white rounded-xl shadow overflow-hidden mb-6">
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
          <th className="p-2 text-left">Akce</th>
        </tr>
      </thead>
      <tbody>
        {ordersArray.map((order) => (
          <tr key={order.id} className="border-b hover:bg-gray-50">
            <td className="p-2">{order.id}</td>
            <td className="p-2">{order.customer_name}</td>
            <td className="p-2">{order.email || "-"}</td>
            <td className="p-2">{order.phone || "-"}</td>
            <td className="p-2">{order.standard_quantity}</td>
            <td className="p-2">{order.low_chol_quantity}</td>
            <td className="p-2">{order.pickup_location}</td>
            <td className="p-2">{order.pickup_date}</td>
            <td className="p-2 font-semibold">{STATUS_LABELS[order.status]}</td>
            <td className="p-2">
              {order.status !== "processed" && order.status !== "canceled" && (
                <button
                  onClick={() => advanceStatus(order)}
                  className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Další status
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Seznam objednávek</h1>

      {/* Nové objednávky */}
      {ordersBySection.new.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-red-600 mb-2">Nové objednávky</h2>
          {renderTable(ordersBySection.new)}
        </div>
      )}

      {/* Zpracovává se */}
      {ordersBySection.processing.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-yellow-600 mb-2">Zpracovává se</h2>
          {renderTable(ordersBySection.processing)}
        </div>
      )}

      {/* Vyřízené / zrušené */}
      {ordersBySection.done.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-green-600 mb-2">Vyřízené / zrušené</h2>
          {renderTable(ordersBySection.done)}
        </div>
      )}
    </div>
  );
}
