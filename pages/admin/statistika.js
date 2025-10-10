// pages/admin/statistika.js
import { useEffect, useMemo, useState } from "react";
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
import { supabase } from "../../lib/supabaseClient";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Statistika page
 * - načítá orders / expenses / daily_eggs přímo ze Supabase
 * - umožňuje přepínat období (rok/měsíc/týden)
 * - umožňuje přesouvat grafy a měnit layout (persistováno v localStorage)
 * 
 * Upraveno: přidán graf "Prodáno vajec (z objednávek)" + responzivní layout pro mobily
 */

export default function StatistikaPage() {
  const { authenticated, ready, login } = useAdminAuth();

  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dailyEggs, setDailyEggs] = useState([]);
  const [period, setPeriod] = useState("rok"); // "rok" | "měsíc" | "týden"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  // --- chart definitions (id -> title) ---
  const chartDefs = {
    orders: "Počet objednávek",
    revenue: "Tržby",
    profit: "Náklady a čistý zisk",
    eggs: "Produkce vajec",
    sold: "Prodáno vajec (z objednávek)", // NOVÝ graf
  };

  // --- charts order (persistováno) - store only IDs to avoid serializing functions ---
  const [charts, setCharts] = useState(() => {
    try {
      if (typeof window === "undefined") return Object.keys(chartDefs);
      const raw = localStorage.getItem("stats_charts_order");
      if (!raw) return Object.keys(chartDefs);
      const parsed = JSON.parse(raw);
      // ensure valid ids and keep any missing ones appended
      const valid = parsed.filter((id) => Object.keys(chartDefs).includes(id));
      const remaining = Object.keys(chartDefs).filter((id) => !valid.includes(id));
      return [...valid, ...remaining];
    } catch {
      return Object.keys(chartDefs);
    }
  });

  // --- layout columns (persistováno) ---
  const [columns, setColumns] = useState(() => {
    try {
      if (typeof window === "undefined") return 1;
      const raw = localStorage.getItem("stats_layout_columns");
      return raw ? Number(raw) : 1;
    } catch {
      return 1;
    }
  });

  // responsive override: on small screens always 1 column
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const effectiveColumns = windowWidth < 768 ? 1 : columns;

  // --- HELPERS ---
  const parseDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d;
    const s = String(d);
    const dt = new Date(s);
    if (!isNaN(dt)) return dt;
    const parts = s.split(".");
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      const dt2 = new Date(iso);
      if (!isNaN(dt2)) return dt2;
    }
    return null;
  };

  const formatLabel = (val) => String(val);

  // status colors
  const STATUS_COLORS = {
    "nová objednávka": "#f87171",
    "zpracovává se": "#facc15",
    "vyřízená": "#34d399",
    "zrušená": "#9ca3af",
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      // ORDERS
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("id, status, payment_total, standard_quantity, low_chol_quantity, pickup_date")
        .order("pickup_date", { ascending: true });
      if (ordersErr) throw ordersErr;
      setOrders(ordersData || []);

      // EXPENSES
      const { data: expensesData, error: expensesErr } = await supabase
        .from("expenses")
        .select("id, date, amount, description")
        .order("date", { ascending: true });
      if (expensesErr) throw expensesErr;
      setExpenses(expensesData || []);

      // DAILY EGGS (table name: daily_eggs)
      const { data: eggsData, error: eggsErr } = await supabase
        .from("daily_eggs")
        .select("id, date, standard_eggs, low_cholesterol_eggs")
        .order("date", { ascending: true });
      if (eggsErr) throw eggsErr;
      setDailyEggs(eggsData || []);
    } catch (err) {
      console.error("Chyba při načítání dat:", err);
      toast.error("Chyba při načítání dat: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // načteme data pokud ready a authenticated
    if (ready && authenticated) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, period, selectedYear, selectedMonth]);

  // --- chart data builders ---
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
      if (key === undefined) return;
      if (!grouped[key]) grouped[key] = { ...Object.fromEntries(Object.keys(STATUS_COLORS).map((s) => [s, 0])) };
      grouped[key][o.status] = (grouped[key][o.status] || 0) + 1;
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const datasets = Object.keys(STATUS_COLORS).map((status) => ({
      label: status,
      data: labels.map((l) => grouped[l]?.[status] || 0),
      backgroundColor: STATUS_COLORS[status],
    }));

    return { labels: labels.map(formatLabel), datasets };
  };

  const getRevenueData = () => {
    const grouped = {};
    (orders || []).filter((o) => o.status === "vyřízená").forEach((o) => {
      const d = parseDate(o.pickup_date);
      if (!d) return;
      let key;
      if (period === "rok") key = d.getFullYear();
      else if (period === "měsíc") key = d.getMonth() + 1;
      else if (period === "týden") {
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return;
        key = d.getDate();
      }
      if (key === undefined) return;
      grouped[key] = (grouped[key] || 0) + Number(o.payment_total || 0);
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    return {
      labels: labels.map(formatLabel),
      datasets: [{ label: "Tržby (Kč)", data: labels.map((l) => grouped[l] || 0), backgroundColor: "#34d399" }],
    };
  };

  const getProfitChartData = () => {
    const revenueGrouped = {};
    const expenseGrouped = {};

    const getKey = (d) => {
      if (period === "rok") return d.getFullYear();
      if (period === "měsíc") return d.getMonth() + 1;
      if (period === "týden") {
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return undefined;
        return d.getDate();
      }
      return undefined;
    };

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

    let labels = [];
    if (period === "rok") labels = Object.keys({ ...revenueGrouped, ...expenseGrouped }).sort((a, b) => Number(a) - Number(b));
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const revenueData = labels.map((l) => revenueGrouped[l] || 0);
    const expenseData = labels.map((l) => expenseGrouped[l] || 0);
    const profitData = revenueData.map((r, i) => r - expenseData[i]);

    return {
      labels: labels.map(formatLabel),
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
      let key;
      if (period === "rok") key = d.getFullYear();
      else if (period === "měsíc") key = d.getMonth() + 1;
      else if (period === "týden") {
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return;
        key = d.getDate();
      }
      if (key === undefined) return;
      const s = Number(rec.standard_eggs || 0);
      const l = Number(rec.low_cholesterol_eggs || 0);
      grouped[key] = (grouped[key] || 0) + s + l;
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    return {
      labels: labels.map(formatLabel),
      datasets: [{ label: "Počet vajec", data: labels.map((l) => grouped[l] || 0), backgroundColor: "#fbbf24" }],
    };
  };

  // --- NOVÝ: prodaná vejce z dokončených objednávek ---
  const getSoldEggsData = () => {
    const grouped = {};
    (orders || []).filter((o) => o.status === "vyřízená").forEach((o) => {
      const d = parseDate(o.pickup_date);
      if (!d) return;
      let key;
      if (period === "rok") key = d.getFullYear();
      else if (period === "měsíc") key = d.getMonth() + 1;
      else if (period === "týden") {
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return;
        key = d.getDate();
      }
      if (key === undefined) return;
      const s = Number(o.standard_quantity || 0);
      const l = Number(o.low_chol_quantity || o.low_chol || 0);
      grouped[key] = (grouped[key] || 0) + s + l;
    });

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    return {
      labels: labels.map(formatLabel),
      datasets: [{ label: "Prodáno vajec", data: labels.map((l) => grouped[l] || 0), backgroundColor: "#f97316" }],
    };
  };

  const getChartDataById = (id) => {
    if (id === "orders") return getOrderCounts();
    if (id === "revenue") return getRevenueData();
    if (id === "profit") return getProfitChartData();
    if (id === "eggs") return getEggsData();
    if (id === "sold") return getSoldEggsData();
    return { labels: [], datasets: [] };
  };

  // --- quick totals for header ---
  const completedOrders = useMemo(() => (orders || []).filter((o) => o.status === "vyřízená"), [orders]);
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.payment_total || 0), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalEggs = (dailyEggs || []).reduce((s, r) => s + Number(r.standard_eggs || 0) + Number(r.low_cholesterol_eggs || 0), 0);

  const years = useMemo(() => {
    const ys = Array.from(
      new Set(
        (orders || [])
          .map((o) => {
            const d = parseDate(o.pickup_date);
            return d ? d.getFullYear() : null;
          })
          .filter(Boolean)
      )
    ).sort();
    if (ys.length === 0) return [new Date().getFullYear()];
    return ys;
  }, [orders]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const v = context.parsed?.y ?? context.parsed ?? 0;
            const label = context.dataset.label || "";
            if (String(label).toLowerCase().includes("trž") || String(label).toLowerCase().includes("kč") || String(label).toLowerCase().includes("zisk") || String(label).toLowerCase().includes("náklad")) {
              return `${label}: ${Number(v).toLocaleString()} Kč`;
            }
            return `${label}: ${Number(v).toLocaleString()}`;
          },
        },
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  // --- move chart and persist order ---
  const moveChart = (index, direction) => {
    const newCharts = [...charts];
    const target = index + direction;
    if (target < 0 || target >= newCharts.length) return;
    [newCharts[index], newCharts[target]] = [newCharts[target], newCharts[index]];
    setCharts(newCharts);
    try {
      if (typeof window !== "undefined") localStorage.setItem("stats_charts_order", JSON.stringify(newCharts));
    } catch {}
  };

  const saveLayoutColumns = (n) => {
    setColumns(n);
    try {
      if (typeof window !== "undefined") localStorage.setItem("stats_layout_columns", String(n));
    } catch {}
  };

  // --- login handler ---
  const handleLogin = () => {
    const result = login(password);
    if (result?.success) {
      toast.success("✅ Přihlášeno");
      setPassword("");
      // fetchData provede useEffect
    } else {
      toast.error(result?.message || "Špatné heslo");
    }
  };

  // pokud kontext ještě neni připravený (kontrola localStorage), nic nezobrazujeme
  if (!ready) return null;

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
          <button onClick={handleLogin} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Přihlásit se
          </button>
        </div>
      </div>
    );
  }

  // --- UI when authenticated ---
  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

      {/* Finanční přehled */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
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
            <p className="text-gray-500">Vejce celkem (produkce)</p>
            <p className="text-2xl font-bold text-yellow-600">{totalEggs.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Přepínač období + layout controls */}
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

        {/* layout selector */}
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

      {/* Grafy - grid podle effectiveColumns (responsive) */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }}>
        {charts.map((chartId, index) => {
          const chartData = getChartDataById(chartId);
          const hasData = Array.isArray(chartData.labels) && chartData.labels.length > 0;
          return (
            <div key={chartId} className="mb-6 bg-white shadow rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{chartDefs[chartId]}</h2>
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

              <div>
                {loading ? (
                  <p>Načítám...</p>
                ) : !hasData ? (
                  <p className="italic text-gray-500">Žádná data pro zobrazené období</p>
                ) : (
                  <Bar data={chartData} options={chartOptions} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
