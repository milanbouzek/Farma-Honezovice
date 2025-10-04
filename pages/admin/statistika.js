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
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekNumber());

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(res => res.json())
      .then(data => setOrders(data.orders))
      .catch(err => console.error(err));
  }, []);

  function getCurrentWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff =
      (now - start + ((start.getDay() + 6) % 7) * 86400000) / 86400000;
    return Math.floor(diff / 7) + 1;
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "Leden","Únor","Březen","Duben","Květen","Červen",
    "Červenec","Srpen","Září","Říjen","Listopad","Prosinec"
  ];

  const getWeekNumber = (d) => {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayNum = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dayNum + 3);
    const firstThursday = new Date(date.getFullYear(), 0, 4);
    const diff = date - firstThursday;
    return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const d = new Date(order.pickup_date.split(".").reverse().join("-"));
      if (timeRange === "year") return d.getFullYear() === selectedYear;
      if (timeRange === "month") return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      if (timeRange === "week") return d.getFullYear() === selectedYear && getWeekNumber(d) === selectedWeek;
      return true;
    });
  }, [orders, timeRange, selectedYear, selectedMonth, selectedWeek]);

  const completedOrders = useMemo(() => filteredOrders.filter(o => o.status === "vyřízená"), [filteredOrders]);

  const ordersChartData = useMemo(() => {
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"],
      datasets: [
        {
          label: "Počet objednávek",
          data: ["nová objednávka","zpracovává se","vyřízená","zrušená"].map(
            s => statusCounts[s] || 0
          ),
          backgroundColor: ["#f87171","#facc15","#34d399","#34d399"],
        },
      ],
    };
  }, [filteredOrders]);

  const revenueChartData = useMemo(() => {
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + ((o.standard_quantity || 0) * 5 + (o.low_chol_quantity || 0) * 7),
      0
    );
    return {
      labels: ["Tržby (Kč)"],
      datasets: [
        {
          label: "Celkem vyděláno",
          data: [totalRevenue],
          backgroundColor: ["#34d399"],
        },
      ],
    };
  }, [completedOrders]);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Statistika objednávek</h1>

      {/* Přepínače a dropdowny */}
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

        {timeRange === "year" && (
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border p-2 rounded"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {timeRange === "month" && (
          <>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="border p-2 rounded"
            >
              {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="border p-2 rounded"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}

        {timeRange === "week" && (
          <select
            value={selectedWeek}
            onChange={e => setSelectedWeek(parseInt(e.target.value))}
            className="border p-2 rounded"
          >
            {Array.from({length:52}, (_,i)=>i+1).map(w=>(
              <option key={w} value={w}>Týden {w}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grafy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-xl p-4">
          <Bar data={ordersChartData} />
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <Bar data={revenueChartData} />
        </div>
      </div>
    </AdminLayout>
  );
}
