import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";

export default function AdminPreorders() {
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPreorders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();
      setPreorders(data.preorders || []);
    } catch (err) {
      toast.error("Chyba při načítání předobjednávek: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreorders();
    const interval = setInterval(fetchPreorders, 10000);
    return () => clearInterval(interval);
  }, []);

  const confirmPreorder = async (order) => {
    if (order.converted) return;

    try {
      const res = await fetch("/api/preorders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.custom((t) => (
          <div
            className={`bg-white shadow-lg rounded-2xl p-5 max-w-md w-full relative ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
          >
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-2">✅ Předobjednávka byla převedena</h3>
            <p className="mb-1">Jméno: {order.name}</p>
            <p className="mb-1">
              Počet vajec: {order.standard_quantity + order.low_chol_quantity} ks
            </p>
            <p className="mb-1">Místo vyzvednutí: {order.pickupLocation || "-"}</p>
          </div>
        ), { duration: 5000 });

        fetchPreorders();
      } else {
        toast.error("Chyba: " + (data.error || "Nepodařilo se potvrdit předobjednávku"));
      }
    } catch (err) {
      toast.error("Chyba při potvrzení: " + err.message);
    }
  };

  const deletePreorder = async (id) => {
    if (!confirm("Opravdu chcete zrušit tuto předobjednávku?")) return;

    try {
      const res = await fetch("/api/preorders/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Předobjednávka byla zrušena");
        fetchPreorders();
      } else {
        toast.error("Chyba při mazání: " + (data.error || "Nepodařilo se odstranit předobjednávku"));
      }
    } catch (err) {
      toast.error("Chyba při mazání: " + err.message);
    }
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-xl shadow overflow-hidden text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Jméno</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Telefon</th>
            <th className="p-2 text-left">Standard</th>
            <th className="p-2 text-left">LowChol</th>
            <th className="p-2 text-left">Místo</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Převedeno</th>
            <th className="p-2 text-left">Akce</th>
          </tr>
        </thead>
        <tbody>
          {preorders.map((order) => (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{order.id}</td>
              <td className="p-2">{order.name}</td>
              <td className="p-2">{order.email || "-"}</td>
              <td className="p-2">{order.phone || "-"}</td>
              <td className="p-2">{order.standard_quantity}</td>
              <td className="p-2">{order.low_chol_quantity}</td>
              <td className="p-2">{order.pickupLocation || "-"}</td>
              <td className="p-2">{order.status}</td>
              <td className="p-2">{order.converted ? "Ano" : "Ne"}</td>
              <td className="p-2 space-x-2 flex flex-wrap gap-1">
                {!order.converted && (
                  <button
                    onClick={() => confirmPreorder(order)}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-xs"
                  >
                    Potvrdit
                  </button>
                )}
                <button
                  onClick={() => deletePreorder(order.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                >
                  Zrušit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">🥚 Správa předobjednávek</h1>

      {loading ? (
        <div className="bg-white shadow rounded-xl p-4 mt-4">
          <p>Načítám předobjednávky…</p>
        </div>
      ) : preorders.length === 0 ? (
        <div className="bg-white shadow rounded-xl p-4 mt-4">
          <p className="italic text-gray-500">Žádné aktivní předobjednávky</p>
        </div>
      ) : (
        renderTable()
      )}
    </AdminLayout>
  );
}
