import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { supabase } from "../../lib/supabaseClient";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatistikaPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState("rok");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];
  const STATUS_COLORS = {
    "nová objednávka": "#f87171",
    "zpracovává se": "#facc15",
    "vyřízená": "#34d399",
    "zrušená": "#9ca3af",
  };

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) setAuthenticated(true);
    else toast.error("❌ Špatné heslo");
  };

  useEffect(() => {
    if (!authenticated) return;

    const fetchData = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id,status,payment_total,standard_quantity,low_chol_quantity,pickup_date");
        if (orderError) console.error(orderError);
        else setOrders(orderData || []);

        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("id,description,amount,date");
        if (expenseError) console.error(expenseError);
        else setExpenses(expenseData || []);
      } catch (err) {
        toast.error("Chyba při načítání dat: " + err.message);
      }
    };

    fetchData();
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

  // --- Počet objednávek podle stavu ---
  const getOrderCounts = () => {
    const grouped = {};
    orders.forEach((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth)
        key = d.getDate();
      if (!key) return;
      if (!grouped[key]) grouped[key] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
      grouped[key][o.status] = (grouped[key][o.status] || 0) + 1;
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    if (period === "týden") labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const datasets = STATUSES.map((status) => ({
      label: status,
      data: labels.map((l) => grouped[l]?.[status] || 0),
      backgroundColor: STATUS_COLORS[status],
    }));

    return { labels, datasets };
  };

  // --- Tržby z dokončených objednávek ---
  const completedOrders = orders.filter((o) => o.status === "vyřízená");

  const getRevenueData = () => {
    const grouped = {};
    completedOrders.forEach((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth)
        key = d.getDate();
      if (!key) return;
      grouped[key] = (grouped[key] || 0) + (o.payment_total || 0);
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    if (period === "týden") labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const data = labels.map((l) => grouped[l] || 0);
    return { labels, datasets: [{ label: "Tržby (Kč)", data, backgroundColor: "#34d399" }] };
  };

  // --- Náklady vs zisk ---
  const getProfitChartData = () => {
    const revenueGrouped = {};
    const expenseGrouped = {};

    const getKey = (d) => {
      if (period === "rok") return d.getFullYear();
      if (period === "měsíc") return d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth)
        return d.getDate();
    };

    completedOrders.forEach((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      const key = getKey(d);
      if (key !== undefined) revenueGrouped[key] = (revenueGrouped[key] || 0) + (o.payment_total || 0);
    });

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = getKey(d);
      if (key !== undefined) expenseGrouped[key] = (expenseGrouped[key] || 0) + (Number(e.amount) || 0);
    });

    let labels = [];
    if (period === "rok") labels = Object.keys({ ...revenueGrouped, ...expenseGrouped }).sort();
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const revenueData = labels.map((l) => revenueGrouped[l] || 0);
    const expenseData = labels.map((l) => expenseGrouped[l] || 0);
    const profitData = revenueData.map((r, i) => r - expenseData[i]);

    return {
      labels,
      datasets: [
        { label: "Náklady", data: expenseData, backgroundColor: "#f87171" },
        { label: "Čistý zisk", data: profitData, backgroundColor: "#10b981" },
      ],
    };
  };

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.payment_total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  const years = Array.from(new Set(orders.map((o) => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear()))).sort();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y || 0} Kč` } },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

      {/* Finanční přehled */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">💰 Finanční přehled</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-500">Tržby</p>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} Kč</p>
          </div>
          <div>
            <p className="text-gray-500">Náklady</p>
            <p className="text-2xl font-bold text-red-500">{totalExpenses.toLocaleString()} Kč</p>
          </div>
          <div>
            <p className="text-gray-500">Čistý zisk</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-700" : "text-red-700"}`}>{totalProfit.toLocaleString()} Kč</p>
          </div>
        </div>
      </div>

      {/* Přepínač období */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <label className="flex items-center gap-1">
          <input type="radio" value="rok" checked={period === "rok"} onChange={() => setPeriod("rok")} /> Rok
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" value="měsíc" checked={period === "měsíc"} onChange={() => setPeriod("měsíc")} /> Měsíc
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" value="týden" checked={period === "týden"} onChange={() => setPeriod("týden")} /> Týden
        </label>

        {(period === "měsíc" || period === "týden") && (
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border rounded p-1 ml-2">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {period === "týden" && (
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="border rounded p-1 ml-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}. měsíc</option>)}
          </select>
        )}
      </div>

      {/* Grafy */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">📦 Počet objednávek podle stavu</h2>
        <Bar data={getOrderCounts()} options={chartOptions} />
      </div>

      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">💰 Tržby z dokončených objednávek</h2>
        <Bar data={getRevenueData()} options={chartOptions} />
      </div>

      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-bold mb-2">💸 Náklady a čistý zisk</h2>
        <Bar data={getProfitChartData()} options={chartOptions} />
      </div>
    </AdminLayout>
  );
}
