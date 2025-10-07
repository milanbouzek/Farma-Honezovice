// pages/admin/statistika.js
import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { useAdminAuth } from "../../components/AdminAuthContext";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatistikaPage() {
  const { authenticated, ready, login } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dailyEggs, setDailyEggs] = useState([]);
  const [period, setPeriod] = useState("rok");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [charts, setCharts] = useState([]);
  const [columns, setColumns] = useState(1);

  // --- Safe fetch function ---
  const fetchJsonSafe = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const text = await res.text();
      if (!text) return {};
      return JSON.parse(text);
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      return {};
    }
  };

  // --- default charts ---
  const defaultCharts = [
    { id: "orders", title: "Počet objednávek", getData: () => getOrderCounts() },
    { id: "revenue", title: "Tržby", getData: () => getRevenueData() },
    { id: "profit", title: "Náklady a čistý zisk", getData: () => getProfitChartData() },
    { id: "eggs", title: "Produkce vajec", getData: () => getEggsData() },
  ];

  // --- Load persisted layout/charts on client ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawCharts = localStorage.getItem("stats_charts_order");
      const savedCharts = rawCharts
        ? JSON.parse(rawCharts)
            .map((id) => defaultCharts.find((c) => c.id === id))
            .filter(Boolean)
            .concat(defaultCharts.filter((c) => !JSON.parse(rawCharts).includes(c.id)))
        : defaultCharts;
      setCharts(savedCharts);

      const savedColumns = localStorage.getItem("stats_layout_columns");
      setColumns(savedColumns ? Number(savedColumns) : 1);
    } catch (e) {
      setCharts(defaultCharts);
      setColumns(1);
    }
  }, []);

  // --- fetch data ---
  const fetchData = async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const jsonOrders = await fetchJsonSafe("/api/admin/orders");
      setOrders(jsonOrders.orders || []);

      const jsonExpenses = await fetchJsonSafe("/api/admin/expenses");
      setExpenses(jsonExpenses.expenses || jsonExpenses || []);

      const jsonEggs = await fetchJsonSafe("/api/admin/daily-eggs");
      setDailyEggs(jsonEggs.data || jsonEggs.records || jsonEggs.dailyEggs || jsonEggs || []);
    } catch (err) {
      console.error(err);
      toast.error("Chyba při načítání dat: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, period, selectedYear, selectedMonth]);

  if (!ready) return null;

  const handleLogin = async () => {
    const result = login(password);
    if (result?.success) {
      toast.success("✅ Přihlášeno");
      setPassword("");
    } else {
      toast.error(result?.message || "Špatné heslo");
    }
  };

  const parseDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt)) {
      const parts = String(d).split(".");
      if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return null;
    }
    return dt;
  };

  const STATUS_COLORS = {
    "nová objednávka": "#f87171",
    "zpracovává se": "#facc15",
    "vyřízená": "#34d399",
    "zrušená": "#9ca3af",
  };

  const getOrderCounts = () => {
    const grouped = {};
    (orders || []).forEach((o) => {
      const d = parseDate(o.pickup_date);
      if (!d) return;
      let key;
      if (period === "rok") key = d.getFullYear();
      else if (period === "měsíc") key = d.getMonth() + 1;
      else if (period === "týden") {
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return;
        key = d.getDate();
      }
      if (!grouped[key]) grouped[key] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
      grouped[key][o.status] = (grouped[key][o.status] || 0) + 1;
    });

    let labels = period === "rok"
      ? Object.keys(grouped).sort()
      : period === "měsíc"
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const datasets = Object.keys(STATUS_COLORS).map((status) => ({
      label: status,
      data: labels.map((l) => grouped[l]?.[status] || 0),
      backgroundColor: STATUS_COLORS[status],
    }));

    return { labels, datasets };
  };

  const getRevenueData = () => {
    const grouped = {};
    (orders || []).filter((o) => o.status === "vyřízená").forEach((o) => {
      const d = parseDate(o.pickup_date);
      if (!d) return;
      let key = period === "rok" ? d.getFullYear() : period === "měsíc" ? d.getMonth() + 1 : d.getDate();
      grouped[key] = (grouped[key] || 0) + Number(o.payment_total || 0);
    });

    let labels = period === "rok"
      ? Object.keys(grouped).sort()
      : period === "měsíc"
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    return {
      labels,
      datasets: [{ label: "Tržby (Kč)", data: labels.map((l) => grouped[l] || 0), backgroundColor: "#34d399" }],
    };
  };

  const getProfitChartData = () => {
    const revenueGrouped = {};
    const expenseGrouped = {};
    const getKey = (d) => (period === "rok" ? d.getFullYear() : period === "měsíc" ? d.getMonth() + 1 : d.getDate());

    (orders || []).filter((o) => o.status === "vyřízená").forEach((o) => {
      const d = parseDate(o.pickup_date);
      if (!d) return;
      const k = getKey(d);
      if (k === undefined) return;
      revenueGrouped[k] = (revenueGrouped[k] || 0) + Number(o.payment_total || 0);
    });

    (expenses || []).forEach((e) => {
      const d = parseDate(e.date);
      if (!d) return;
      const k = getKey(d);
      if (k === undefined) return;
      expenseGrouped[k] = (expenseGrouped[k] || 0) + Number(e.amount || 0);
    });

    const labels = period === "rok"
      ? Object.keys({ ...revenueGrouped, ...expenseGrouped }).sort()
      : period === "měsíc"
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

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
    (dailyEggs || []).forEach((rec) => {
      const d = parseDate(rec.date);
      if (!d) return;
      const key = period === "rok" ? d.getFullYear() : period === "měsíc" ? d.getMonth() + 1 : d.getDate();
      const s = Number(rec.standard_eggs || rec.standard || 0);
      const l = Number(rec.low_cholesterol_eggs || rec.low_chol || 0);
      grouped[key] = (grouped[key] || 0) + s + l;
    });

    const labels = period === "rok"
      ? Object.keys(grouped).sort()
      : period === "měsíc"
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    return { labels, datasets: [{ label: "Počet vajec", data: labels.map((l) => grouped[l] || 0), backgroundColor: "#fbbf24" }] };
  };

  const completedOrders = useMemo(() => (orders || []).filter((o) => o.status === "vyřízená"), [orders]);
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.payment_total || 0), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalEggs = (dailyEggs || []).reduce((s, r) => s + Number(r.standard_eggs || r.standard || 0) + Number(r.low_cholesterol_eggs || r.low_chol || 0), 0);

  const years = Array.from(new Set((orders || []).map((o) => {
    const d = parseDate(o.pickup_date);
    return d ? d.getFullYear() : null;
  }).filter(Boolean))).sort();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const v = context.parsed?.y ?? context.parsed ?? 0;
            if (String(context.dataset.label).toLowerCase().includes("trž") || String(context.dataset.label).toLowerCase().includes("kč") || String(context.dataset.label).toLowerCase().includes("zisk") || String(context.dataset.label).toLowerCase().includes("náklad")) {
              return `${context.dataset.label}: ${Number(v).toLocaleString()} Kč`;
            }
            return `${context.dataset.label}: ${Number(v).toLocaleString()}`;
          },
        },
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  const moveChart = (index, direction) => {
    const newCharts = [...charts];
    const target = index + direction;
    if (target < 0 || target >= newCharts.length) return;
    [newCharts[index], newCharts[target]] = [newCharts[target], newCharts[index]];
    setCharts(newCharts);
    try {
      localStorage.setItem("stats_charts_order", JSON.stringify(newCharts.map((c) => c.id)));
    } catch (e) {}
  };

  const saveLayoutColumns = (n) => {
    setColumns(n);
    try { localStorage.setItem("stats_layout_columns", String(n)); } catch (e) {}
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
        <div className="flex gap-2">
          <button onClick={handleLogin} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Přihlásit se</button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div><p className="text-gray-500">Tržby</p><p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} Kč</p></div>
          <div><p className="text-gray-500">Náklady</p><p className="text-2xl font-bold text-red-500">{totalExpenses.toLocaleString()} Kč</p></div>
          <div><p className="text-gray-500">Čistý zisk</p><p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-700" : "text-red-700"}`}>{totalProfit.toLocaleString()} Kč</p></div>
          <div><p className="text-gray-500">Vejce celkem</p><p className="text-2xl font-bold text-yellow-600">{totalEggs.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <label className="flex items-center gap-1"><input type="radio" value="rok" checked={period === "rok"} onChange={() => setPeriod("rok")} /> Rok</label>
        <label className="flex items-center gap-1"><input type="radio" value="měsíc" checked={period === "měsíc"} onChange={() => setPeriod("měsíc")} /> Měsíc</label>
        <label className="flex items-center gap-1"><input type="radio" value="týden" checked={period === "týden"} onChange={() => setPeriod("týden")} /> Týden</label>

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

        <div className="ml-auto flex items-center gap-2">
          <span className="text-gray-500">Rozložení:</span>
          <select value={columns} onChange={(e) => saveLayoutColumns(Number(e.target.value))} className="border rounded p-1">
            <option value={1}>1 sloupec (velké)</option>
            <option value={2}>2 sloupce</option>
            <option value={3}>3 sloupce</option>
            <option value={4}>4 sloupce</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {charts.map((chart, index) => (
          <div key={chart.id} className="mb-6 bg-white shadow rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">{chart.title}</h2>
              <div className="flex gap-1">
                <button onClick={() => moveChart(index, -1)} disabled={index === 0} className="px-2 py-1 bg-gray-200 rounded">↑</button>
                <button onClick={() => moveChart(index, 1)} disabled={index === charts.length - 1} className="px-2 py-1 bg-gray-200 rounded">↓</button>
              </div>
            </div>
            <Bar data={chart.getData()} options={chartOptions} />
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
