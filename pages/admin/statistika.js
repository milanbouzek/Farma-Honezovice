import { useEffect, useState } from "react";
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
import { useAdminAuth } from "../../components/AdminAuthContext";
import AdminLayout from "../../components/AdminLayout";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// 📊 Mock funkce – nahraď později reálnými daty
const getOrdersData = () => ({
  labels: ["Leden", "Únor", "Březen", "Duben"],
  datasets: [{ label: "Počet objednávek", data: [30, 45, 40, 60], backgroundColor: "#3b82f6" }],
});

const getRevenueData = () => ({
  labels: ["Leden", "Únor", "Březen", "Duben"],
  datasets: [{ label: "Tržby (Kč)", data: [12000, 15000, 13000, 20000], backgroundColor: "#22c55e" }],
});

const getProfitData = () => ({
  labels: ["Leden", "Únor", "Březen", "Duben"],
  datasets: [{ label: "Zisk (Kč)", data: [4000, 6000, 5500, 9000], backgroundColor: "#eab308" }],
});

const getEggsData = () => ({
  labels: ["Leden", "Únor", "Březen", "Duben"],
  datasets: [{ label: "Produkce vajec", data: [1200, 1450, 1320, 1800], backgroundColor: "#ef4444" }],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 10 },
    },
  },
};

export default function Statistika() {
  const { authenticated, ready } = useAdminAuth();
  const [charts, setCharts] = useState([]);
  const [layout, setLayout] = useState("1");
  const [period, setPeriod] = useState("rok");

  // 🧠 Načtení uloženého pořadí a layoutu
  useEffect(() => {
    if (!ready) return;

    const savedOrder = JSON.parse(localStorage.getItem("charts_order"));
    const savedLayout = localStorage.getItem("charts_layout") || "1";

    const defaultCharts = [
      { id: "orders", title: "Počet objednávek", getData: getOrdersData },
      { id: "revenue", title: "Tržby", getData: getRevenueData },
      { id: "profit", title: "Zisk", getData: getProfitData },
      { id: "eggs", title: "Produkce vajec", getData: getEggsData },
    ];

    if (savedOrder) {
      const ordered = savedOrder
        .map((id) => defaultCharts.find((ch) => ch.id === id))
        .filter(Boolean);
      const missing = defaultCharts.filter((ch) => !savedOrder.includes(ch.id));
      setCharts([...ordered, ...missing]);
    } else {
      setCharts(defaultCharts);
    }

    setLayout(savedLayout);
  }, [ready]);

  // 🔼🔽 Přesun grafů a uložení pořadí
  const moveChart = (idx, dir) => {
    const newCharts = [...charts];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newCharts.length) return;
    [newCharts[idx], newCharts[targetIdx]] = [newCharts[targetIdx], newCharts[idx]];
    setCharts(newCharts);
    localStorage.setItem("charts_order", JSON.stringify(newCharts.map((ch) => ch.id)));
  };

  // ⚙️ Změna layoutu
  const changeLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem("charts_layout", newLayout);
  };

  if (!ready) return null;
  if (!authenticated)
    return <div className="text-center mt-10">Nejdříve se přihlas do administrace.</div>;

  const gridCols = {
    "1": "grid-cols-1",
    "2": "sm:grid-cols-2 grid-cols-1",
    "4": "xl:grid-cols-4 md:grid-cols-2 grid-cols-1",
  }[layout];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📊 Statistiky</h1>

      {/* 🔧 Přepínač rozložení */}
      <div className="flex flex-wrap items-center mb-6 gap-4">
        <div className="flex items-center">
          <span className="mr-2">Rozložení:</span>
          <select
            value={layout}
            onChange={(e) => changeLayout(e.target.value)}
            className="border rounded p-1"
          >
            <option value="1">1 sloupec</option>
            <option value="2">2 sloupce</option>
            <option value="4">4 sloupce</option>
          </select>
        </div>

        {/* ⏱️ Přepínač období */}
        <div>
          <label className="mr-4">
            <input
              type="radio"
              name="period"
              value="rok"
              checked={period === "rok"}
              onChange={() => setPeriod("rok")}
            />{" "}
            Rok
          </label>
          <label className="mr-4">
            <input
              type="radio"
              name="period"
              value="měsíc"
              checked={period === "měsíc"}
              onChange={() => setPeriod("měsíc")}
            />{" "}
            Měsíc
          </label>
          <label>
            <input
              type="radio"
              name="period"
              value="týden"
              checked={period === "týden"}
              onChange={() => setPeriod("týden")}
            />{" "}
            Týden
          </label>
        </div>
      </div>

      {/* 📈 Grafy */}
      <div className={`grid ${gridCols} gap-6`}>
        {charts.map((chart, idx) => (
          <div key={chart.id} className="bg-white shadow rounded-xl p-4 h-[400px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">{chart.title}</h2>
              <div>
                <button onClick={() => moveChart(idx, -1)} className="mr-2">
                  ⬆️
                </button>
                <button onClick={() => moveChart(idx, 1)}>⬇️</button>
              </div>
            </div>
            <div className="h-[320px]">
              <Bar data={chart.getData()} options={chartOptions} />
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
