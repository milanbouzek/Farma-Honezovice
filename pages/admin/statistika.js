import { useState, useEffect } from "react";
import AdminNav from "../../components/AdminNav";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function StatistikaPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Chyba při načítání objednávek:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Přehled objednávek podle statusu
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Přehled celkového počtu vajec podle typu
  const eggCounts = orders.reduce((acc, o) => {
    acc.standard = (acc.standard || 0) + (o.standard_quantity || 0);
    acc.lowChol = (acc.lowChol || 0) + (o.low_chol_quantity || 0);
    return acc;
  }, {});

  const barData = {
    labels: ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"],
    datasets: [
      {
        label: "Počet objednávek",
        data: [
          statusCounts["nová objednávka"] || 0,
          statusCounts["zpracovává se"] || 0,
          statusCounts["vyřízená"] || 0,
          statusCounts["zrušená"] || 0,
        ],
        backgroundColor: ["#f87171", "#facc15", "#34d399", "#34d399"]
      }
    ]
  };

  const pieData = {
    labels: ["Standard", "LowChol"],
    datasets: [
      {
        label: "Počet vajec",
        data: [eggCounts.standard || 0, eggCounts.lowChol || 0],
        backgroundColor: ["#3b82f6", "#f59e0b"]
      }
    ]
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <AdminNav />
      <h1 className="text-3xl font-bold mb-6">Statistika</h1>

      {loading ? <p>Načítám data...</p> : (
        <>
          <div className="mb-8 bg-white shadow p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Počet objednávek podle statusu</h2>
            <Bar data={barData} />
          </div>

          <div className="mb-8 bg-white shadow p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Celkové množství vajec objednaných</h2>
            <Pie data={pieData} />
          </div>
        </>
      )}
    </div>
  );
}
