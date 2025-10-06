import { useEffect, useState, useContext } from "react";
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
import { AdminAuthContext } from "../../components/AdminAuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatistikaPage() {
  const { isAuthenticated } = useContext(AdminAuthContext);

  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [eggsProduction, setEggsProduction] = useState([]);
  const [period, setPeriod] = useState("rok");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [charts, setCharts] = useState([]);

  // --- Načtení dat po autentikaci ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("id, status, payment_total, standard_quantity, low_chol_quantity, pickup_date");
        setOrders(orderData || []);

        const { data: expenseData } = await supabase
          .from("expenses")
          .select("id, description, amount, date");
        setExpenses(expenseData || []);

        const { data: eggsData } = await supabase
          .from("daily_eggs")
          .select("id, standard_eggs, low_cholesterol_eggs, date");
        setEggsProduction(eggsData || []);
      } catch (err) {
        toast.error("Chyba při načítání dat: " + err.message);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <p className="text-xl text-gray-500">Pro zobrazení statistiky se přihlaste přes dashboard.</p>
      </div>
    );
  }

  // --- Výpočty pro grafy ---
  const completedOrders = orders.filter((o) => o.status === "vyřízená");

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
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth)
        key = d.getDate();
      if (!key) return;
      if (!grouped[key]) grouped[key] = { ...STATUS_COLORS };
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
    completedOrders.forEach((o) => {
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
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

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

  const getEggsData = () => {
    const grouped = {};
    eggsProduction.forEach((e) => {
      const d = new Date(e.date);
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = d.getMonth() + 1;
      if (period === "týden" && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth) key = d.getDate();
      if (!key) return;
      grouped[key] = (grouped[key] || 0) + ((e.standard_eggs || 0) + (e.low_cholesterol_eggs || 0));
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const data = labels.map((l) => grouped[l] || 0);
    return { labels, datasets: [{ label: "Počet vajec", data, backgroundColor: "#fbbf24" }] };
  };

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.payment_total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalEggs = eggsProduction.reduce(
    (sum, e) => sum + (Number(e.standard_eggs || 0) + Number(e.low_cholesterol_eggs || 0)),
    0
  );

  const years = Array.from(
    new Set(orders.map((o) => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear()))
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

  useEffect(() => {
    setCharts([
      { id: "orders", title: "Počet objednávek", getData: getOrderCounts },
      { id: "revenue", title: "Tržby", getData: getRevenueData },
      { id: "profit", title: "Náklady a čistý zisk", getData: getProfitChartData },
      { id: "eggs", title: "Produkce vajec", getData: getEggsData },
    ]);
  }, [orders, expenses, eggsProduction, period, selectedMonth, selectedYear]);

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

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
            <p className="text-2xl font-bold text-yellow-600">{totalEggs.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Přepínač období */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <label className="flex items-center gap-1">
          <input type="radio" value="rok" checked={period === "rok"} onChange={() => setPeriod("rok")} /> Rok
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            value="měsíc"
            checked={period === "měsíc"}
            onChange={() => setPeriod("měsíc")}
          />{" "}
          Měsíc
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            value="týden"
            checked={period === "týden"}
            onChange={() => setPeriod("týden")}
          />{" "}
          Týden
        </label>
        {(period === "měsíc" || period === "týden") && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded p-1 ml-2"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
        {period === "týden" && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded p-1 ml-2"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}. měsíc
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grafy */}
      {charts.map((chart, index) => (
        <div key={chart.id} className="mb-6 bg-white shadow rounded-xl p-4">
          <h2 className="text-xl font-bold mb-2">{chart.title}</h2>
          <Bar data={chart.getData()} options={chartOptions} />
        </div>
      ))}
    </AdminLayout>
  );
}
