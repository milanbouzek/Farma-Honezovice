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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";

export default function StatistikaPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [eggsProduction, setEggsProduction] = useState([]);
  const [period, setPeriod] = useState("rok");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [charts, setCharts] = useState([]);

  // --- Přihlášení ---
  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  // --- Načtení dat ---
  const fetchData = async () => {
    try {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*");
      setOrders(orderData || []);

      const { data: expenseData } = await supabase
        .from("expenses")
        .select("*");
      setExpenses(expenseData || []);

      const { data: eggsData } = await supabase
        .from("daily_eggs")
        .select("*");
      setEggsProduction(eggsData || []);
    } catch (err) {
      toast.error("Chyba při načítání dat: " + err.message);
    }
  };

  useEffect(() => {
    if (authenticated) fetchData();
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

  // --- Příprava dat pro grafy ---
  const getRevenueChartData = () => {
    const grouped = {};
    orders
      .filter(o => o.status === "vyřízená")
      .forEach(o => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        let key = period === "rok" ? d.getFullYear() : period === "měsíc" ? d.getMonth() + 1 : d.getDate();
        grouped[key] = (grouped[key] || 0) + Number(o.payment_total || 0);
      });

    let labels = period === "rok" ? Object.keys(grouped).sort() :
                 period === "měsíc" ? Array.from({ length: 12 }, (_, i) => i + 1) :
                 Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const data = labels.map(l => grouped[l] || 0);

    return { labels, datasets: [{ label: "Tržby (Kč)", data, backgroundColor: "#34d399" }] };
  };

  const getExpensesProfitChartData = () => {
    const revenueGrouped = {};
    const expenseGrouped = {};

    const getKey = (d) => period === "rok" ? d.getFullYear() :
                        period === "měsíc" ? d.getMonth() + 1 : d.getDate();

    orders.filter(o => o.status === "vyřízená").forEach(o => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      const key = getKey(d);
      revenueGrouped[key] = (revenueGrouped[key] || 0) + Number(o.payment_total || 0);
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = getKey(d);
      expenseGrouped[key] = (expenseGrouped[key] || 0) + Number(e.amount || 0);
    });

    let labels = period === "rok" ? Object.keys({ ...revenueGrouped, ...expenseGrouped }).sort() :
                 period === "měsíc" ? Array.from({ length: 12 }, (_, i) => i + 1) :
                 Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const revenueData = labels.map(l => revenueGrouped[l] || 0);
    const expenseData = labels.map(l => expenseGrouped[l] || 0);
    const profitData = revenueData.map((r, i) => r - expenseData[i]);

    return {
      labels,
      datasets: [
        { label: "Náklady", data: expenseData, backgroundColor: "#f87171" },
        { label: "Čistý zisk", data: profitData, backgroundColor: "#10b981" }
      ]
    };
  };

  const getEggsChartData = () => {
    const grouped = {};
    eggsProduction.forEach(e => {
      const d = new Date(e.date);
      const key = period === "rok" ? d.getFullYear() :
                  period === "měsíc" ? d.getMonth() + 1 :
                  d.getDate();
      grouped[key] = (grouped[key] || 0) + (Number(e.standard_eggs || 0) + Number(e.low_cholesterol_eggs || 0));
    });

    let labels = period === "rok" ? Object.keys(grouped).sort() :
                 period === "měsíc" ? Array.from({ length: 12 }, (_, i) => i + 1) :
                 Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const data = labels.map(l => grouped[l] || 0);

    return { labels, datasets: [{ label: "Počet vajec", data, backgroundColor: "#fbbf24" }] };
  };

  const totalRevenue = orders.filter(o => o.status === "vyřízená").reduce((sum, o) => sum + Number(o.payment_total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalEggs = eggsProduction.reduce((sum, e) => sum + Number(e.standard_eggs || 0) + Number(e.low_cholesterol_eggs || 0), 0);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}` } }
    },
    scales: { y: { beginAtZero: true } }
  };

  // --- Grafy ---
  const chartList = [
    { id: "revenue", title: "Tržby", getData: getRevenueChartData },
    { id: "profit", title: "Náklady a čistý zisk", getData: getExpensesProfitChartData },
    { id: "eggs", title: "Produkce vajec", getData: getEggsChartData }
  ];

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

      {/* Přehled */}
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
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-700" : "text-red-700"}`}>{totalProfit.toLocaleString()} Kč</p>
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
          <input type="radio" value="měsíc" checked={period === "měsíc"} onChange={() => setPeriod("měsíc")} /> Měsíc
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" value="týden" checked={period === "týden"} onChange={() => setPeriod("týden")} /> Týden
        </label>
        {(period === "měsíc" || period === "týden") && (
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border rounded p-1 ml-2">
            {Array.from(new Set(orders.map(o => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear()))).sort().map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {period === "týden" && (
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="border rounded p-1 ml-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}. měsíc</option>)}
          </select>
        )}
      </div>

      {/* Grafy */}
      {chartList.map(chart => (
        <div key={chart.id} className="mb-6 bg-white shadow rounded-xl p-4">
          <h2 className="text-xl font-bold mb-2">{chart.title}</h2>
          <Bar data={chart.getData()} options={chartOptions} />
        </div>
      ))}
    </AdminLayout>
  );
}
