import { useEffect, useState } from "react";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatistikaPage() {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState("rok"); // "rok" | "měsíc" | "týden"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders);
    };
    fetchOrders();
  }, []);

  const completedOrders = orders.filter((o) => o.status === "vyřízená");

  // --- Barvy pro jednotlivé statusy ---
  const STATUS_COLORS = {
    "nová objednávka": "#f87171", // červená
    "zpracovává se": "#facc15",   // žlutá
    "vyřízená": "#34d399",        // zelená
    "zrušená": "#9ca3af",         // šedá
  };

  // --- Počet objednávek ---
  const getOrderCounts = () => {
    let filtered = orders;

    if (period === "rok") {
      const grouped = {};
      filtered.forEach((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        const y = d.getFullYear();
        if (!grouped[y]) grouped[y] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
        grouped[y][o.status] = (grouped[y][o.status] || 0) + 1;
      });
      const labels = Object.keys(grouped).sort();
      const datasets = Object.keys(STATUS_COLORS).map((status) => ({
        label: status,
        data: labels.map((y) => grouped[y]?.[status] || 0),
        backgroundColor: STATUS_COLORS[status],
      }));
      return { labels, datasets };
    }

    if (period === "měsíc") {
      filtered = orders.filter((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d.getFullYear() === selectedYear;
      });
      const grouped = {};
      filtered.forEach((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        const m = d.getMonth() + 1;
        if (!grouped[m]) grouped[m] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
        grouped[m][o.status] = (grouped[m][o.status] || 0) + 1;
      });
      const labels = Array.from({ length: 12 }, (_, i) => i + 1);
      const datasets = Object.keys(STATUS_COLORS).map((status) => ({
        label: status,
        data: labels.map((m) => grouped[m]?.[status] || 0),
        backgroundColor: STATUS_COLORS[status],
      }));
      return { labels, datasets };
    }

    if (period === "týden") {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      filtered = orders.filter((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d >= weekAgo && d <= today;
      });
      const grouped = {};
      filtered.forEach((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        const day = d.toISOString().slice(0, 10);
        if (!grouped[day]) grouped[day] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
        grouped[day][o.status] = (grouped[day][o.status] || 0) + 1;
      });
      const labels = Object.keys(grouped).sort();
      const datasets = Object.keys(STATUS_COLORS).map((status) => ({
        label: status,
        data: labels.map((d) => grouped[d]?.[status] || 0),
        backgroundColor: STATUS_COLORS[status],
      }));
      return { labels, datasets };
    }
  };

  // --- Tržby z dokončených objednávek ---
  const getRevenueData = () => {
    let filtered = completedOrders;

    if (period === "rok") {
      const grouped = {};
      filtered.forEach((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        const y = d.getFullYear();
        if (!grouped[y]) grouped[y] = 0;
        grouped[y] += o.standard_quantity * 5 + o.low_chol_quantity * 7;
      });
      const labels = Object.keys(grouped).sort();
      return {
        labels,
        datasets: [
          {
            label: "Tržby (Kč)",
            data: labels.map((y) => grouped[y]),
            backgroundColor: "#34d399",
          },
        ],
      };
    }

    if (period === "měsíc") {
      filtered = filtered.filter((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d.getFullYear() === selectedYear;
      });
      const grouped = {};
      filtered.forEach((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        const month = d.getMonth() + 1;
        if (!grouped[month]) grouped[month] = 0;
        grouped[month] += o.standard_quantity * 5 + o.low_chol_quantity * 7;
      });
      const labels = Array.from({ length: 12 }, (_, i) => i + 1);
      return {
        labels,
        datasets: [
          {
            label: "Tržby (Kč)",
            data: labels.map((m) => grouped[m] || 0),
            backgroundColor: "#34d399",
          },
        ],
      };
    }

    if (period === "týden") {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      filtered = filtered.filter((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d >= weekAgo && d <= today;
      });
      const grouped = {};
      filtered.forEach((o) => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        const day = d.toISOString().slice(0, 10);
        if (!grouped[day]) grouped[day] = 0;
        grouped[day] += o.standard_quantity * 5 + o.low_chol_quantity * 7;
      });
      const labels = Object.keys(grouped).sort();
      return {
        labels,
        datasets: [
          {
            label: "Tržby (Kč)",
            data: labels.map((d) => grouped[d] || 0),
            backgroundColor: "#34d399",
          },
        ],
      };
    }
  };

  const years = Array.from(
    new Set(orders.map((o) => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear()))
  ).sort();

  // --- Společné nastavení grafů ---
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `${context.dataset.label}: ${value}${context.dataset.label.includes("Kč") ? " Kč" : ""}`;
          },
        },
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📊 Statistika objednávek</h1>

      {/* Přepínač období */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <label className="flex items-center gap-1">
          <input type="radio" value="rok" checked={period==="rok"} onChange={() => setPeriod("rok")} /> Rok
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" value="měsíc" checked={period==="měsíc"} onChange={() => setPeriod("měsíc")} /> Měsíc
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" value="týden" checked={period==="týden"} onChange={() => setPeriod("týden")} /> Týden
        </label>

        {period === "měsíc" && (
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
      </div>

      {/* Graf počtu objednávek */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">📦 Počet objednávek podle stavu</h2>
        <Bar data={getOrderCounts()} options={chartOptions} />
      </div>

      {/* Graf tržeb */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-bold mb-2">💰 Tržby z dokončených objednávek</h2>
        <Bar data={getRevenueData()} options={chartOptions} />
      </div>
    </AdminLayout>
  );
}
