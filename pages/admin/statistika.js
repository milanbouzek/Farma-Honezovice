import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatistikaPage() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data.orders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const chartData = {
    labels: ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"],
    datasets: [
      {
        label: "Počet objednávek",
        data: ["nová objednávka","zpracovává se","vyřízená","zrušená"].map((s) => statusCounts[s] || 0),
        backgroundColor: ["#f87171","#facc15","#34d399","#34d399"],
      },
    ],
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Statistika objednávek</h1>
      <div className="bg-white shadow rounded-xl p-4">
        <Bar data={chartData} />
      </div>
    </AdminLayout>
  );
}
