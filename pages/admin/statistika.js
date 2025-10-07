import { useState, useEffect } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import { useAdminAuth } from "../../components/AdminAuthContext";
import toast, { Toaster } from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

export default function StatistikaPage() {
  const { authenticated, ready } = useAdminAuth();
  const [layout, setLayout] = useState("grid");
  const [order, setOrder] = useState([]);
  const [data, setData] = useState({
    orders: [],
    eggs: [],
    expenses: [],
  });
  const [loading, setLoading] = useState(true);

  // === Fetch reálných dat ze Supabase ===
  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: orders }, { data: eggs }, { data: expenses }] = await Promise.all([
        supabase.from("orders").select("id, pickup_date, standard_quantity, low_chol_quantity, total_price"),
        supabase.from("daily_eggs").select("date, standard_eggs, low_cholesterol_eggs"),
        supabase.from("expenses").select("date, amount"),
      ]);

      setData({
        orders: orders || [],
        eggs: eggs || [],
        expenses: expenses || [],
      });
    } catch (err) {
      toast.error("Nepodařilo se načíst data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === Uložit a načíst rozložení z localStorage ===
  useEffect(() => {
    const savedOrder = localStorage.getItem("statsOrder");
    const savedLayout = localStorage.getItem("statsLayout");
    if (savedOrder) setOrder(JSON.parse(savedOrder));
    if (savedLayout) setLayout(savedLayout);
    fetchData();
  }, []);

  const handleReorder = (newOrder) => {
    setOrder(newOrder);
    localStorage.setItem("statsOrder", JSON.stringify(newOrder));
  };

  const handleLayoutChange = (type) => {
    setLayout(type);
    localStorage.setItem("statsLayout", type);
  };

  // === Grafy ===
  const charts = {
    orders: {
      title: "📦 Počet objednávek podle dne",
      component: (
        <Bar
          data={{
            labels: aggregateByDay(data.orders, "pickup_date").labels,
            datasets: [
              {
                label: "Objednávky",
                data: aggregateByDay(data.orders, "pickup_date").values,
                backgroundColor: "#60a5fa",
              },
            ],
          }}
        />
      ),
    },
    eggs: {
      title: "🥚 Denní produkce vajec",
      component: (
        <Line
          data={{
            labels: data.eggs.map((e) => e.date),
            datasets: [
              {
                label: "Standardní vejce",
                data: data.eggs.map((e) => e.standard_eggs),
                borderColor: "#10b981",
                tension: 0.3,
              },
              {
                label: "Nízký cholesterol",
                data: data.eggs.map((e) => e.low_cholesterol_eggs),
                borderColor: "#f59e0b",
                tension: 0.3,
              },
            ],
          }}
        />
      ),
    },
    revenue: {
      title: "💰 Tržby",
      component: (
        <Bar
          data={{
            labels: aggregateByDay(data.orders, "pickup_date").labels,
            datasets: [
              {
                label: "Tržby (Kč)",
                data: aggregateByDay(data.orders, "pickup_date", "total_price").values,
                backgroundColor: "#34d399",
              },
            ],
          }}
        />
      ),
    },
    expenses: {
      title: "💸 Náklady",
      component: (
        <Line
          data={{
            labels: data.expenses.map((e) => e.date),
            datasets: [
              {
                label: "Náklady (Kč)",
                data: data.expenses.map((e) => e.amount),
                borderColor: "#ef4444",
                tension: 0.3,
              },
            ],
          }}
        />
      ),
    },
  };

  // === Pomocná funkce na seskupení objednávek podle dne ===
  function aggregateByDay(items, dateField, valueField) {
    const map = {};
    items.forEach((i) => {
      const d = i[dateField]?.split("T")[0];
      if (!d) return;
      map[d] = (map[d] || 0) + (valueField ? i[valueField] || 0 : 1);
    });
    const labels = Object.keys(map).sort();
    const values = labels.map((l) => map[l]);
    return { labels, values };
  }

  if (!ready) return null;
  if (!authenticated)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg">Přístup odepřen</p>
      </div>
    );

  const chartOrder = order.length ? order : Object.keys(charts);

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Statistika</h1>

      {/* Ovládací panel */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => handleLayoutChange("grid")}
          className={`px-3 py-1 rounded ${layout === "grid" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Mřížka 2×2
        </button>
        <button
          onClick={() => handleLayoutChange("list")}
          className={`px-3 py-1 rounded ${layout === "list" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Sloupec (1×4)
        </button>
        <p className="text-sm text-gray-500">Pořadí se uloží automaticky</p>
      </div>

      {loading ? (
        <p>Načítám data…</p>
      ) : (
        <div
          className={
            layout === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "flex flex-col gap-6"
          }
        >
          {chartOrder.map((key) => (
            <div
              key={key}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("chart", key)}
              onDrop={(e) => {
                e.preventDefault();
                const dragged = e.dataTransfer.getData("chart");
                const newOrder = [...chartOrder];
                const from = newOrder.indexOf(dragged);
                const to = newOrder.indexOf(key);
                newOrder.splice(from, 1);
                newOrder.splice(to, 0, dragged);
                handleReorder(newOrder);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow cursor-move"
            >
              <h2 className="text-xl font-semibold mb-2">{charts[key].title}</h2>
              {charts[key].component}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
