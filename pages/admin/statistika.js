// pages/admin/statistika.js
import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import AdminLayout from "../../components/AdminLayout";
import { useAdminAuth } from "../../components/AdminAuthContext";

// import grafu jen na klientovi (vyhneme se SSR chybám)
const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), { ssr: false });

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
  const [period, setPeriod] = useState("rok"); // "rok" | "měsíc" | "týden"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  // klient-only stav pro pořadí grafů / layout
  const [charts, setCharts] = useState([]);
  const [columns, setColumns] = useState(1);

  // ----- pomocné utility -----
  const parseDate = (d) => {
    if (!d) return null;
    // pokud je už JS Date
    if (d instanceof Date && !isNaN(d)) return d;
    // pokud přijde číslo (timestamp)
    if (typeof d === "number") {
      const dt = new Date(d);
      return isNaN(dt) ? null : dt;
    }
    // pokud přijde objekt (supabase může vracet Date jako string nebo objekt), zkusíme string
    const s = String(d).trim();

    // běžné ISO (YYYY-MM-DD nebo s časem)
    const isoCandidate = s.replace(/\s+/, "T");
    const dtIso = new Date(isoCandidate);
    if (!isNaN(dtIso)) return dtIso;

    // český formát DD.MM.YYYY
    const parts = s.split(".");
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      const dt = new Date(iso);
      return isNaN(dt) ? null : dt;
    }

    // někdy Supabase vrací "/Date(165...)/" nebo jiné dziady -> zkusíme fallback že jsou YYYY-MM-DD
    const maybeMatch = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (maybeMatch) {
      const iso = `${maybeMatch[1]}-${maybeMatch[2].padStart(2, "0")}-${maybeMatch[3].padStart(2, "0")}`;
      const dt = new Date(iso);
      return isNaN(dt) ? null : dt;
    }

    return null;
  };

  const STATUS_COLORS = {
    "nová objednávka": "#f87171",
    "zpracovává se": "#facc15",
    "vyřízená": "#34d399",
    "zrušená": "#9ca3af",
  };

  // ----- chart data builders -----
  const getOrderCounts = () => {
    const grouped = {};
    const invalid = new Set();

    (orders || []).forEach((o) => {
      const d = parseDate(o.pickup_date);
      if (!d) {
        invalid.add(String(o.pickup_date));
        return;
      }
      let key;
      if (period === "rok") key = d.getFullYear();
      else if (period === "měsíc") key = d.getMonth() + 1;
      else if (period === "týden") {
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return;
        key = d.getDate();
      }
      if (key === undefined) return;
      if (!grouped[key]) grouped[key] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
      grouped[key][o.status] = (grouped[key][o.status] || 0) + 1;
    });

    if (invalid.size) console.warn("Neparsovaná pickup_date (sample):", Array.from(invalid).slice(0,5));

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    const datasets = Object.keys(STATUS_COLORS).map((status) => ({
      label: status,
      data: labels.map((l) => grouped[l]?.[status] || 0),
      backgroundColor: STATUS_COLORS[status],
    }));

    return { labels, datasets };
  };

  const getRevenueData = () => {
    const grouped = {};
    const invalid = new Set();

    (orders || []).filter((o) => o.status === "vyřízená").forEach((o) => {
      const d = parseDate(o.pickup_date);
      if (!d) {
        invalid.add(String(o.pickup_date));
        return;
      }
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

    if (invalid.size) console.warn("Neparsovaná pickup_date (revenue):", Array.from(invalid).slice(0,5));

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    return { labels, datasets: [{ label: "Tržby (Kč)", data: labels.map((l) => grouped[l] || 0), backgroundColor: "#34d399" }] };
  };

  const getProfitChartData = () => {
    const revenueGrouped = {};
    const expenseGrouped = {};
    const invalid = new Set();

    const getKey = (d) => {
      if (!d) return undefined;
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
      if (!d) { invalid.add(String(o.pickup_date)); return; }
      const k = getKey(d);
      if (k === undefined) return;
      revenueGrouped[k] = (revenueGrouped[k] || 0) + Number(o.payment_total || 0);
    });

    (expenses || []).forEach((e) => {
      const d = parseDate(e.date);
      if (!d) { invalid.add(String(e.date)); return; }
      const k = getKey(d);
      if (k === undefined) return;
      expenseGrouped[k] = (expenseGrouped[k] || 0) + Number(e.amount || 0);
    });

    if (invalid.size) console.warn("Neparsovaná data (profit):", Array.from(invalid).slice(0,5));

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
    const invalid = new Set();

    (dailyEggs || []).forEach((rec) => {
      const d = parseDate(rec.date);
      if (!d) { invalid.add(String(rec.date)); return; }
      let key;
      if (period === "rok") key = d.getFullYear();
      else if (period === "měsíc") key = d.getMonth() + 1;
      else if (period === "týden") {
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return;
        key = d.getDate();
      }
      if (key === undefined) return;
      const s = Number(rec.standard_eggs || rec.standard || rec.quantity || 0);
      const l = Number(rec.low_cholesterol_eggs || rec.low_chol || 0);
      grouped[key] = (grouped[key] || 0) + s + l;
    });

    if (Object.keys(grouped).length === 0 && (dailyEggs || []).length > 0) {
      // pokud žádné validní date keys, upozorníme a logneme sample dat
      console.warn("Produkce vajec: žádné validní data pro zvolené období. Ukázka řádků:", (dailyEggs || []).slice(0,5));
    }

    let labels = [];
    if (period === "rok") labels = Object.keys(grouped).sort();
    else if (period === "měsíc") labels = Array.from({ length: 12 }, (_, i) => i + 1);
    else labels = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

    return { labels, datasets: [{ label: "Počet vajec", data: labels.map((l) => grouped[l] || 0), backgroundColor: "#fbbf24" }] };
  };

  // ----- totals + helpers -----
  const completedOrders = useMemo(() => (orders || []).filter((o) => o.status === "vyřízená"), [orders]);
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.payment_total || 0), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalEggs = (dailyEggs || []).reduce((s, r) => s + Number(r.standard_eggs || r.standard || r.quantity || 0) + Number(r.low_cholesterol_eggs || r.low_chol || 0), 0);

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

  // ----- default charts (funkční i když charts state inicializujeme v useEffect) -----
  const defaultCharts = [
    { id: "orders", title: "Počet objednávek", getData: getOrderCounts },
    { id: "revenue", title: "Tržby", getData: getRevenueData },
    { id: "profit", title: "Náklady a čistý zisk", getData: getProfitChartData },
    { id: "eggs", title: "Produkce vajec", getData: getEggsData },
  ];

  // načtení pořadí grafů + sloupců z localStorage (jen na klientu)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("stats_charts_order");
      if (raw) {
        const ids = JSON.parse(raw);
        const arranged = ids.map((id) => defaultCharts.find((c) => c.id === id)).filter(Boolean)
          .concat(defaultCharts.filter((c) => !ids.includes(c.id)));
        setCharts(arranged);
      } else {
        setCharts(defaultCharts);
      }
    } catch (e) {
      console.warn("Chyba při načítání uloženého pořadí grafů:", e);
      setCharts(defaultCharts);
    }

    try {
      const savedCols = localStorage.getItem("stats_layout_columns");
      setColumns(savedCols ? Number(savedCols) : 1);
    } catch (e) {
      setColumns(1);
    }
  }, []);

  // fetch data (safe)
  const fetchData = async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      // orders
      const resOrders = await fetch("/api/admin/orders");
      if (!resOrders.ok) {
        const t = await resOrders.text();
        throw new Error("orders API error: " + t);
      }
      const jsonOrders = await resOrders.json();
      setOrders(jsonOrders.orders || jsonOrders || []);

      // expenses
      const resExpenses = await fetch("/api/admin/expenses");
      if (!resExpenses.ok) {
        const t = await resExpenses.text();
        throw new Error("expenses API error: " + t);
      }
      const jsonExpenses = await resExpenses.json();
      setExpenses(jsonExpenses.expenses || jsonExpenses || []);

      // daily eggs
      const resEggs = await fetch("/api/admin/daily-eggs");
      if (!resEggs.ok) {
        const t = await resEggs.text();
        throw new Error("daily-eggs API error: " + t);
      }
      const jsonEggs = await resEggs.json();
      setDailyEggs(jsonEggs.data || jsonEggs.records || jsonEggs.dailyEggs || jsonEggs || []);
    } catch (err) {
      console.error("fetchData error:", err);
      // pokud je to striktní chybová hláška z Date parsování, přidej hint
      if (String(err).toLowerCase().includes("pattern") || String(err).toLowerCase().includes("expected")) {
        toast.error("Chyba při parsování dat (pravděpodobně špatný formát datumu). Ověř API / DB formáty (viz konzole).");
      } else {
        toast.error("Chyba při načítání dat: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, period, selectedYear, selectedMonth]);

  // --- handlers pro pořadí a layout ---
  const moveChart = (index, direction) => {
    const newCharts = [...charts];
    const target = index + direction;
    if (target < 0 || target >= newCharts.length) return;
    [newCharts[index], newCharts[target]] = [newCharts[target], newCharts[index]];
    setCharts(newCharts);
    try {
      localStorage.setItem("stats_charts_order", JSON.stringify(newCharts.map((c) => c.id)));
    } catch (e) {
      console.warn("Nepodařilo se uložit pořadí grafů:", e);
    }
  };

  const saveLayoutColumns = (n) => {
    setColumns(n);
    try {
      localStorage.setItem("stats_layout_columns", String(n));
    } catch (e) {
      console.warn("Nepodařilo se uložit layout:", e);
    }
  };

  // --- login UI ---
  if (!ready) return null; // počkej dokud kontext nepřipraven
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
          <button onClick={() => {
            const r = login(password);
            if (r?.success) {
              toast.success("✅ Přihlášeno");
              setPassword("");
            } else {
              toast.error(r?.message || "Špatné heslo");
            }
          }} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Přihlásit se</button>
        </div>
      </div>
    );
  }

  // --- hlavní UI ---
  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

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
        {(charts && charts.length > 0 ? charts : defaultCharts).map((chart, index) => (
          <div key={chart.id} className="mb-6 bg-white shadow rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">{chart.title}</h2>
              <div className="flex gap-1">
                <button onClick={() => moveChart(index, -1)} disabled={index === 0} className="px-2 py-1 bg-gray-200 rounded">↑</button>
                <button onClick={() => moveChart(index, 1)} disabled={index === (charts.length || defaultCharts.length) - 1} className="px-2 py-1 bg-gray-200 rounded">↓</button>
              </div>
            </div>

            <div>
              <Bar data={chart.getData()} options={chartOptions} />
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
