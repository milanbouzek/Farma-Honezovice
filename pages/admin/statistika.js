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
  const [period, setPeriod] = useState("rok"); // "rok", "měsíc", "týden"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1–12

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data.orders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtrované dokončené objednávky pro tržby
  const completedOrders = orders.filter((o) => o.status === "vyřízená");

  // --- Počet objednávek podle status ---
  const getOrderCounts = () => {
    const filtered = orders.filter((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      if (period === "rok") return true;
      if (period === "měsíc") return d.getFullYear() === selectedYear;
      if (period === "týden") {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return d >= weekStart && d <= weekEnd;
      }
      return true;
    });

    const grouped = {};

    filtered.forEach((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = `${d.getMonth() + 1}.${d.getFullYear()}`;
      if (period === "týden") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = startOfWeek.toLocaleDateString();
      }

      if (!grouped[key]) grouped[key] = { "nová objednávka": 0, "zpracovává se": 0, "vyřízená": 0, "zrušená": 0 };
      grouped[key][o.status] = (grouped[key][o.status] || 0) + 1;
    });

    const labels = Object.keys(grouped).sort((a,b)=>{
      if(period==="rok") return a-b;
      if(period==="měsíc") {
        const [m1,y1] = a.split(".").map(Number);
        const [m2,y2] = b.split(".").map(Number);
        return y1!==y2 ? y1-y2 : m1-m2;
      }
      return new Date(a) - new Date(b);
    });

    const datasets = ["nová objednávka","zpracovává se","vyřízená","zrušená"].map((status, i) => ({
      label: status,
      data: labels.map((l) => grouped[l][status] || 0),
      backgroundColor: ["#f87171","#facc15","#34d399","#60a5fa"][i],
    }));

    return { labels, datasets };
  };

  // --- Tržby dokončené objednávky ---
  const getRevenueData = () => {
    const filtered = completedOrders.filter((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      if (period === "rok") return true;
      if (period === "měsíc") return d.getFullYear() === selectedYear;
      if (period === "týden") {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return d >= weekStart && d <= weekEnd;
      }
      return true;
    });

    const grouped = {};

    filtered.forEach((o) => {
      const d = new Date(o.pickup_date.split(".").reverse().join("-"));
      let key;
      if (period === "rok") key = d.getFullYear();
      if (period === "měsíc") key = `${d.getMonth() + 1}.${d.getFullYear()}`;
      if (period === "týden") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = startOfWeek.toLocaleDateString();
      }

      if (!grouped[key]) grouped[key] = 0;
      grouped[key] += (o.standard_quantity + o.low_chol_quantity) * (o.standard_quantity * 5 + o.low_chol_quantity * 7 ? 1 : 0); // cena
    });

    const labels = Object.keys(grouped).sort((a,b)=>{
      if(period==="rok") return a-b;
      if(period==="měsíc") {
        const [m1,y1] = a.split(".").map(Number);
        const [m2,y2] = b.split(".").map(Number);
        return y1!==y2 ? y1-y2 : m1-m2;
      }
      return new Date(a) - new Date(b);
    });

    const dataset = [{
      label: "Tržby (Kč)",
      data: labels.map((l) => grouped[l] || 0),
      backgroundColor: "#34d399"
    }];

    return { labels, datasets: dataset };
  };

  // --- Unikátní roky pro dropdown ---
  const years = Array.from(new Set(orders.map((o) => new Date(o.pickup_date.split(".").reverse().join("-")).getFullYear()))).sort((a,b)=>b-a);
  const months = Array.from({length:12},(_,i)=>i+1);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Statistika objednávek</h1>

      {/* Výběr období */}
      <div className="flex gap-4 mb-6 items-center">
        <select value={period} onChange={(e)=>setPeriod(e.target.value)} className="border p-2 rounded">
          <option value="rok">Rok</option>
          <option value="měsíc">Měsíc</option>
          <option value="týden">Týden</option>
        </select>

        {(period==="měsíc" || period==="rok") && (
          <select value={selectedYear} onChange={(e)=>setSelectedYear(Number(e.target.value))} className="border p-2 rounded">
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {period==="měsíc" && (
          <select value={selectedMonth} onChange={(e)=>setSelectedMonth(Number(e.target.value))} className="border p-2 rounded">
            {months.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {/* Graf: počet objednávek */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="font-bold mb-2">Počet objednávek podle statusu</h2>
        <Bar data={getOrderCounts()} options={{ responsive:true, plugins:{legend:{position:"top"}} }} />
      </div>

      {/* Graf: tržby */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="font-bold mb-2">Tržby z dokončených objednávek (Kč)</h2>
        <Bar data={getRevenueData()} options={{ responsive:true, plugins:{legend:{position:"top"}} }} />
      </div>
    </AdminLayout>
  );
}
