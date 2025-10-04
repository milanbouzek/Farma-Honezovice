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
  const [timeRange, setTimeRange] = useState("month"); // week / month / year
  const [startDate, setStartDate] = useState(""); // DD.MM.YYYY
  const [endDate, setEndDate] = useState("");

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data.orders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // pomocné funkce
  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    const [dd, mm, yyyy] = cz.split(".");
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  };

  const filterOrdersByDate = (orderList) => {
    const start = startDate ? parseDateFromCZ(startDate) : null;
    const end = endDate ? parseDateFromCZ(endDate) : null;
    return orderList.filter((o) => {
      const d = parseDateFromCZ(o.pickup_date);
      if (!d) return false;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  };

  const filteredOrders = filterOrdersByDate(orders);

  // skupiny podle statusu
  const statusCounts = filteredOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const revenuePerStatus = filteredOrders.reduce((acc, order) => {
    const total =
      (parseInt(order.standard_quantity || 0) * 5 || 0) +
      (parseInt(order.low_chol_quantity || 0) * 7 || 0);
    acc[order.status] = (acc[order.status] || 0) + total;
    return acc;
  }, {});

  const labels = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

  const ordersChartData = {
    labels,
    datasets: [
      {
        label: "Počet objednávek",
        data: labels.map((s) => statusCounts[s] || 0),
        backgroundColor: ["#f87171", "#facc15", "#34d399", "#34d399"],
      },
    ],
  };

  const revenueChartData = {
    labels,
    datasets: [
      {
        label: "Tržba (Kč)",
        data: labels.map((s) => revenuePerStatus[s] || 0),
        backgroundColor: ["#f87171", "#facc15", "#34d399", "#34d399"],
      },
    ],
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Statistika objednávek</h1>

      {/* Volba období */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="week">Týden</option>
          <option value="month">Měsíc</option>
          <option value="year">Rok</option>
        </select>
        <input
          type="text"
          placeholder="DD.MM.YYYY"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="DD.MM.YYYY"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* Graf: počet objednávek */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Počet objednávek</h2>
        <Bar data={ordersChartData} />
      </div>

      {/* Graf: tržba v Kč */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-bold mb-2">Tržba (Kč)</h2>
        <Bar data={revenueChartData} />
      </div>
    </AdminLayout>
  );
}
