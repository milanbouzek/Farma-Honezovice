import { useEffect, useState, useMemo } from "react";
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
  const [timeRange, setTimeRange] = useState("month"); // week / month / year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    "Leden","Únor","Březen","Duben","Květen","Červen",
    "Červenec","Srpen","Září","Říjen","Listopad","Prosinec"
  ];

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(res => res.json())
      .then(data => setOrders(data.orders))
      .catch(err => console.error(err));
  }, []);

  const completedOrders = useMemo(
    () => orders.filter(o => o.status === "vyřízená"),
    [orders]
  );

  // --- AGREGACE PRO GRAFY ---
  const chartData = useMemo(() => {
    if (!completedOrders.length) return { labels: [], datasets: [] };

    let labels = [];
    let ordersData = [];
    let revenueData = [];

    if (timeRange === "year") {
      // roky
      const years = Array.from(new Set(completedOrders.map(o => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear()))).sort();
      labels = years.map(y => y.toString());
      ordersData = years.map(y => completedOrders.filter(o => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear() === y).length);
      revenueData = years.map(y => completedOrders.filter(o => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear() === y)
        .reduce((sum, o) => sum + ((o.standard_quantity || 0)*5 + (o.low_chol_quantity||0)*7), 0)
      );
    }

    if (timeRange === "month") {
      // měsíce vybraného roku
      labels = months;
      ordersData = months.map((_, idx) => completedOrders.filter(o => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      }).length);
      revenueData = months.map((_, idx) => completedOrders.filter(o => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      }).reduce((sum,o)=>sum+((o.standard_quantity||0)*5+(o.low_chol_quantity||0)*7),0));
    }

    if (timeRange === "week") {
      // týdny vybraného roku
      const getWeekNumber = (d) => {
        const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayNum = (date.getDay() + 6) % 7;
        date.setDate(date.getDate() - dayNum + 3);
        const firstThursday = new Date(date.getFullYear(),0,4);
        const diff = date - firstThursday;
        return 1 + Math.round(diff / (7*24*60*60*1000));
      };
      const weeks = Array.from({length:52}, (_,i)=>i+1);
      labels = weeks.map(w=>`Týden ${w}`);
      ordersData = weeks.map(w => completedOrders.filter(o => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d.getFullYear() === selectedYear && getWeekNumber(d) === w;
      }).length);
      revenueData = weeks.map(w => completedOrders.filter(o => {
        const d = new Date(o.pickup_date.split(".").reverse().join("-"));
        return d.getFullYear() === selectedYear && getWeekNumber(d) === w;
      }).reduce((sum,o)=>sum+((o.standard_quantity||0)*5+(o.low_chol_quantity||0)*7),0));
    }

    return {
      labels,
      ordersData,
      revenueData
    };
  }, [completedOrders, timeRange, selectedYear]);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Statistika objednávek</h1>

      {/* Přepínače a výběr období */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        {["week","month","year"].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded font-semibold shadow ${
              timeRange === range ? "bg-green-500 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {range === "week" ? "Týden" : range === "month" ? "Měsíc" : "Rok"}
          </button>
        ))}

        {(timeRange === "month" || timeRange === "week") && (
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border p-2 rounded"
          >
            {Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grafy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-xl p-4">
          <Bar
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  label: "Počet objednávek",
                  data: chartData.ordersData,
                  backgroundColor: "#f87171",
                },
              ],
            }}
          />
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <Bar
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  label: "Celkem vyděláno (Kč)",
                  data: chartData.revenueData,
                  backgroundColor: "#34d399",
                },
              ],
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
