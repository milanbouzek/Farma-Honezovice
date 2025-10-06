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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

export default function StatistikaPage() {
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [eggsProduction, setEggsProduction] = useState([]);
  const [period, setPeriod] = useState("rok");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 🔐 zapamatování přihlášení
  const [authenticated, setAuthenticated] = useState(
    typeof window !== "undefined" && localStorage.getItem("auth") === "true"
  );
  const [password, setPassword] = useState("");

  // --- Načtení dat ze Supabase ---
  useEffect(() => {
    if (!authenticated) return;

    const fetchData = async () => {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, status, payment_total, standard_quantity, low_chol_quantity, pickup_date");
      if (orderError) console.error("❌ Chyba při načítání objednávek:", orderError);
      else console.log("✅ Orders:", orderData);
      setOrders(orderData || []);

      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("id, description, amount, date");
      if (expenseError) console.error("❌ Chyba při načítání nákladů:", expenseError);
      else console.log("✅ Expenses:", expenseData);
      setExpenses(expenseData || []);

      const { data: eggsData, error: eggsError } = await supabase
        .from("daily_eggs")
        .select("id, standard_eggs, low_cholesterol_eggs, date");
      if (eggsError) console.error("❌ Chyba při načítání vajec:", eggsError);
      else console.log("✅ Eggs:", eggsData);
      setEggsProduction(eggsData || []);
    };

    fetchData();
  }, [authenticated]);

  const completedOrders = orders.filter((o) => o.status === "vyřízená");

  const STATUS_COLORS = {
    "nová objednávka": "#f87171",
    "zpracovává se": "#facc15",
    "vyřízená": "#34d399",
    "zrušená": "#9ca3af",
  };

  // 📊 Počet objednávek
  const getOrderCounts = () => {
    const grouped = {};
    orders.forEach((o) => {
      if (!o.pickup_date) return;
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth)
        key = d.getDate();
      if (!key) return;
      if (!grouped[key])
        grouped[key] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
      grouped[key][o.status] = (grouped[key][o.status] || 0) + 1;
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    if (period === "týden")
      labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const datasets = Object.keys(STATUS_COLORS).map((status) => ({
      label: status,
      data: labels.map((l) => grouped[l]?.[status] || 0),
      backgroundColor: STATUS_COLORS[status],
    }));

    return { labels, datasets };
  };

  // 💰 Tržby
  const getRevenueData = () => {
    const grouped = {};
    completedOrders.forEach((o) => {
      if (!o.pickup_date) return;
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
    if (period === "týden")
      labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const data = labels.map((l) => grouped[l] || 0);
    return { labels, datasets: [{ label: "Tržby (Kč)", data, backgroundColor: "#34d399" }] };
  };

  // 💵 Náklady a zisk
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
      if (!o.pickup_date) return;
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      const key = getKey(d);
      if (key !== undefined) revenueGrouped[key] = (revenueGrouped[key] || 0) + (o.payment_total || 0);
    });

    expenses.forEach((e) => {
      if (!e.date) return;
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

  // 🥚 Produkce vajec
  const getEggsData = () => {
    const grouped = {};
    eggsProduction.forEach((e) => {
      if (!e.date) return;
      const d = new Date(e.date);
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth)
        key = d.getDate();
      if (!key) return;
      grouped[key] = (grouped[key] || 0) + (Number(e.standard_eggs) + Number(e.low_cholesterol_eggs) || 0);
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const data = labels.map((l) => grouped[l] || 0);
    return { labels, datasets: [{ label: "Počet vajec", data, backgroundColor: "#fbbf24" }] };
  };

  // 📦 Přehled
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.payment_total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalEggs = eggsProduction.reduce(
    (sum, e) => sum + (Number(e.standard_eggs) + Number(e.low_cholesterol_eggs) || 0),
    0
  );

  const years = Array.from(
    new Set(orders.map((o) => new Date(o.pickup_date?.split(".").reverse().join("-")).getFullYear()))
  ).sort();

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

  const [charts, setCharts] = useState([
    { id: "orders", title: "Počet objednávek", getData: getOrderCounts },
    { id: "revenue", title: "Tržby", getData: getRevenueData },
    { id: "profit", title: "Náklady a čistý zisk", getData: getProfitChartData },
    { id: "eggs", title: "Produkce vajec", getData: getEggsData },
  ]);

  const moveChart = (index, direction) => {
    const newCharts = [...charts];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCharts.length) return;
    [newCharts[index], newCharts[targetIndex]] = [newCharts[targetIndex], newCharts[index]];
    setCharts(newCharts);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("auth", "true");
      setAuthenticated(true);
    } else toast.error("❌ Špatné heslo");
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

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Statistika</h1>
        <button
          onClick={() => {
            localStorage.removeItem("auth");
            setAuthenticated(false);
          }}
          className="text-sm text-gray-500 hover:underline"
        >
          Odhlásit se
        </button>
      </div>

      {/* Finanční přehled */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
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
            <p
              className={`text-2xl font-bold ${
                totalProfit >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {totalProfit.toLocaleString()} Kč
            </p>
          </div>
          <div>
            <p className="text-gray-500">Vejce celkem</p>
            <p className="text-2xl font-bold text-yellow-600">
              {totalEggs.toLocaleString()}
            </p>
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
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
        {period === "týden" && (
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="border rounded p-1 ml-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}. měsíc</option>
            ))}
          </select>
        )}
      </div>

      {/* Grafy */}
      {charts.map((chart, index) => (
        <div key={chart.id} className="mb-6 bg-white shadow rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">{chart.title}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => moveChart(index, -1)}
                disabled={index === 0}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                ↑
              </button>
              <button
                onClick={() => moveChart(index, 1)}
                disabled={index === charts.length - 1}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                ↓
              </button>
            </div>
          </div>
          <Bar data={chart.getData()} options={chartOptions} />
        </div>
      ))}
    </AdminLayout>
  );
}
