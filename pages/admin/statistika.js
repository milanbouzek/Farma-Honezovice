import AdminLayout from "./AdminLayout";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Statistika() {
  const data = {
    labels: ["Nové", "Zpracovává se", "Vyřízené", "Zrušené"],
    datasets: [
      {
        label: "Počet objednávek",
        data: [5, 3, 7, 2], // nahradíš dynamicky z API
        backgroundColor: ["red", "orange", "green", "green"],
      },
    ],
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Statistika objednávek</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <Bar data={data} />
      </div>
    </AdminLayout>
  );
}
