// pages/admin/index.js
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import StockBox from "../../components/StockBox";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [preorders, setPreorders] = useState([]);

  // === Denní produkce ===
  const [dailyProduction, setDailyProduction] = useState("");
  const [loadingProduction, setLoadingProduction] = useState(false);

  // --- ORDERS ---
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      toast.error("Chyba při načítání objednávek: " + err.message);
    }
  };

  // --- PREORDERS ---
  const fetchPreorders = async () => {
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();
      setPreorders(data.preorders || data || []);
    } catch (err) {
      toast.error("Chyba při načítání předobjednávek: " + err.message);
    }
  };

  // --- EGGS SETTINGS ---
  const fetchDailyProduction = async () => {
    try {
      const res = await fetch("/api/admin/eggs-settings");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Nepodařilo se načíst hodnotu");

      setDailyProduction(data.daily_production || "");
    } catch (err) {
      toast.error("Chyba při načítání denní produkce");
    }
  };

  const handleSaveProduction = async () => {
    setLoadingProduction(true);

    try {
      const res = await fetch("/api/admin/eggs-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_production: Number(dailyProduction) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Denní produkce uložena ✓");
    } catch (err) {
      toast.error("Chyba při ukládání denní produkce");
    } finally {
      setLoadingProduction(false);
    }
  };

  // mount
  useEffect(() => {
    fetchOrders();
    fetchPreorders();
    fetchDailyProduction();
  }, []);

  // --- ORDER STATS ---
  const orderStats = {
    new: orders.filter((o) => o.status === "nová objednávka").length,
    processing: orders.filter((o) => o.status === "zpracovává se").length,
    done: orders.filter((o) => o.status === "vyřízená").length,
    cancelled: orders.filter((o) => o.status === "zrušená").length,
  };

  // --- PREORDER STATS ---
  const preorderStats = {
    waiting: preorders.filter((p) => p.status === "čeká").length,
    confirmed: preorders.filter((p) => p.status === "potvrzená").length,
    cancelled: preorders.filter((p) => p.status === "zrušená").length,
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />

      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      {/* === DENNÍ PRODUKCE === */}
      <div className="bg-white shadow p-5 rounded-xl mb-6 max-w-md">
        <h2 className="text-xl font-bold mb-3">🥚 Denní produkce</h2>

        <input
          type="number"
          className="input input-bordered w-full mb-3"
          value={dailyProduction}
          onChange={(e) => setDailyProduction(e.target.value)}
          placeholder="Počet vajec za den"
        />

        <button
          onClick={handleSaveProduction}
          className="btn btn-success w-full"
          disabled={loadingProduction}
        >
          {loadingProduction ? "Ukládám…" : "Uložit"}
        </button>

        <p className="text-sm text-gray-500 mt-2">
          Průměrná denní snáška všech slepic.
        </p>
      </div>

      {/* === SKLAD & CENY === */}
      <StockBox editable={true} />

      {/* === STATISTIKY OBJEDNÁVEK === */}
      <div className="bg-white shadow p-5 rounded-xl mt-6 mb-6">
        <h2 className="text-xl font-bold mb-3">📦 Objednávky (rychlý přehled)</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Nové" count={orderStats.new} color="text-red-600" />
          <StatBox label="Zpracovává se" count={orderStats.processing} color="text-yellow-600" />
          <StatBox label="Vyřízené" count={orderStats.done} color="text-green-600" />
          <StatBox label="Zrušené" count={orderStats.cancelled} color="text-gray-500" />
        </div>
      </div>

      {/* === STATISTIKY PŘEDOBJEDNÁVEK === */}
      <div className="bg-white shadow p-5 rounded-xl mb-6">
        <h2 className="text-xl font-bold mb-3">🥚 Předobjednávky (rychlý přehled)</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBox label="Čeká" count={preorderStats.waiting} color="text-yellow-600" />
          <StatBox label="Potvrzené" count={preorderStats.confirmed} color="text-green-600" />
          <StatBox label="Zrušené" count={preorderStats.cancelled} color="text-gray-500" />
        </div>
      </div>
    </AdminLayout>
  );
}

function StatBox({ label, count, color }) {
  return (
    <div className="border rounded-xl p-4 text-center shadow-sm bg-gray-50">
      <p className={`text-sm font-semibold ${color}`}>{label}</p>
      <p className="text-2xl font-bold mt-1">{count}</p>
    </div>
  );
}
