// pages/admin/statistika.js
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { supabase } from "../../lib/supabaseClient";
import { useAdminAuth } from "../../components/AdminAuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatistikaPage() {
  const { authenticated, ready, login } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [eggsProduction, setEggsProduction] = useState([]);
  const [period, setPeriod] = useState("rok");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [password, setPassword] = useState("");
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    if (!authenticated) return;

    const fetchData = async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, status, payment_total, standard_quantity, low_chol_quantity, pickup_date");
      setOrders(orderData || []);

      const { data: expenseData } = await supabase
        .from("expenses")
        .select("id, description, amount, date");
      setExpenses(expenseData || []);

      const { data: eggsData } = await supabase
        .from("eggs_production")
        .select("id, quantity, date");
      setEggsProduction(eggsData || []);
    };

    fetchData();
  }, [authenticated]);

  if (!ready) return null;

  if (!authenticated) {
    const handleLogin = () => {
      const result = login(password);
      if (!result.success) toast.error("❌ " + result.message);
    };

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

  // --- Funkce pro grafy ---
  const STATUS_COLORS = {
    "nová objednávka": "#f87171",
    "zpracovává se": "#facc15",
    "vyřízená": "#34d399",
    "zrušená": "#9ca3af",
  };

  const getOrderCounts = () => {
    const grouped = {};
    orders.forEach((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth) key = d.getDate();
      if (!key) return;
      if (!grouped[key]) grouped[key] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
      grouped[key][o.status] = (grouped[key][o.status] || 0) + 1;
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    if (period === "týden") labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const datasets = Object.keys(STATUS_COLORS).map((status) => ({
      label: status,
      data: labels.map((l) => grouped[l]?.[status] || 0),
      backgroundColor: STATUS_COLORS[status],
    }));

    return { labels, datasets };
  };

  const getRevenueData = () => {
    const grouped = {};
    orders.filter(o => o.status === "vyřízená").forEach((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth) key = d.getDate();
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

  const getProfitChartData = () => {
    const revenueGrouped = {};
    const expenseGrouped = {};
    const getKey = (d) => {
      if (period === "rok") return d.getFullYear();
      if (period === "měsíc") return d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth) return d.getDate();
    };

    orders.filter(o => o.status === "vyřízená").forEach((o) => {
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

  const getEggsData = () => {
    const grouped = {};
    eggsProduction.forEach((e) => {
      const d = new Date(e.date);
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth) key = d.getDate();
      if (!key) return;
      grouped[key] = (grouped[key] || 0) + (e.quantity || 0);
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const data = labels.map((l) => grouped[l] || 0);
    return { labels, datasets: [{ label: "Počet vajec", data, backgroundColor: "#fbbf24" }] };
  };

  // --- Přepínač období ---
  const years = Array.from(new Set(orders.map((o) => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear()))).sort();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y || 0}`,
        },
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  useEffect(() => {
    setCharts([
      { id: "orders", title: "Počet objednávek", getData: getOrderCounts },
      { id: "revenue", title: "Tržby", getData: getRevenueData },
      { id: "profit", title: "Náklady a čistý zisk", getData: getProfitChartData },
      { id: "eggs", title: "Produkce vajec", getData: getEggsData },
    ]);
  }, [orders, expenses, eggsProduction, period, selectedMonth, selectedYear]);

  const moveChart = (index, direction) => {
    const newCharts = [...charts];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCharts.length) return;
    [newCharts[index], newCharts[targetIndex]] = [newCharts[targetIndex], newCharts[index]];
    setCharts(newCharts);
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

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

        {period === "týden" && (
          <>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="border p-1 rounded">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="border p-1 rounded">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </>
        )}
      </div>

      {charts.map((chart, idx) => (
        <div key={chart.id} className="bg-white shadow rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">{chart.title}</h2>
            <div>
              <button onClick={() => moveChart(idx, -1)} className="mr-2">⬆️</button>
              <button onClick={() => moveChart(idx, 1)}>⬇️</button>
            </div>
          </div>
          <Bar data={chart.getData()} options={chartOptions} />
        </div>
      ))}
    </AdminLayout>
  );
}
