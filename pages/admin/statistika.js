import { useEffect, useState } from "react";
import AdminNav from "../../components/AdminNav";
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

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []));
  }, []);

  const statusLabels = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];
  const statusCounts = statusLabels.map(
    (status) => orders.filter((o) => o.status === status).length
  );

  const data = {
    labels: ["Nové", "Zpracovává se", "Vyřízené", "Zrušené"],
    datasets: [
      {
        label: "Počet objednávek",
        data: statusCounts,
        backgroundColor: ["#f87171", "#facc15", "#4ade80", "#86efac"],
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <AdminNav />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika</h1>
      <div className="bg-white shadow p-4 rounded-lg">
        <Bar data={data} />
      </div>
    </div>
  );
}
