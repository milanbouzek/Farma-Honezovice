import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import NavMenu from "../../components/NavMenu";
import { useAdminAuth } from "../../context/AdminAuthContext";
import toast, { Toaster } from "react-hot-toast";
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

export default function Statistika() {
  const { authenticated } = useAdminAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (authenticated) {
      fetch("/api/admin/orders")
        .then((res) => res.json())
        .then((data) => setOrders(data.orders))
        .catch((err) => toast.error("Chyba při načítání objednávek: " + err.message));
    }
  }, [authenticated]);

  if (!authenticated) return <p>Musíte být přihlášeni.</p>;

  const statuses = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];
  const counts = statuses.map((s) => orders.filter((o) => o.status === s).length);

  const data = {
    labels: statuses,
    datasets: [
      {
        label: "Počet objednávek",
        data: counts,
        backgroundColor: ["#f87171", "#facc15", "#4ade80", "#4ade80"],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavMenu />
      <div className="p-6">
        <Toaster position="top-center" />
        <h1 className="text-3xl font-bold mb-6">Statistika objednávek</h1>
        <div className="bg-white p-6 rounded-xl shadow">
          <Bar data={data} />
        </div>
      </div>
    </div>
  );
}
