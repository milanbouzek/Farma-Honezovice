import { useEffect, useState } from "react";
import { supabaseServer } from "../../lib/supabaseServerClient";
import { useRouter } from "next/router";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Kontrola přihlášení
    if (typeof window !== "undefined") {
      const loggedIn = sessionStorage.getItem("admin_logged_in");
      if (!loggedIn) router.push("/admin/login");
    }

    async function fetchOrders() {
      try {
        const { data, error } = await supabaseServer
          .from("orders")
          .select("*")
          .order("pickup_date", { ascending: true });

        if (error) throw error;
        setOrders(data);
      } catch (err) {
        console.error("Chyba při načítání objednávek:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  const toggleProcessed = async (orderId, currentStatus) => {
    try {
      const { error } = await supabaseServer
        .from("orders")
        .update({ processed: !currentStatus })
        .eq("id", orderId);
      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, processed: !currentStatus } : o))
      );
    } catch (err) {
      console.error("Chyba při aktualizaci:", err);
    }
  };

  if (loading) return <p className="p-6">Načítám objednávky...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Správa objednávek</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Jméno</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Telefon</th>
            <th className="border p-2">Počet standard</th>
            <th className="border p-2">Počet low chol</th>
            <th className="border p-2">Datum vyzvednutí</th>
            <th className="border p-2">Stav</th>
            <th className="border p-2">Akce</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={o.processed ? "bg-green-100" : "bg-red-100"}>
              <td className="border p-2">{o.id}</td>
              <td className="border p-2">{o.customer_name}</td>
              <td className="border p-2">{o.email || "-"}</td>
              <td className="border p-2">{o.phone || "-"}</td>
              <td className="border p-2">{o.standard_quantity}</td>
              <td className="border p-2">{o.low_chol_quantity}</td>
              <td className="border p-2">{o.pickup_date}</td>
              <td className="border p-2 font-bold">{o.processed ? "Vyřízeno" : "Čeká"}</td>
              <td className="border p-2">
                <button
                  onClick={() => toggleProcessed(o.id, o.processed)}
                  className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded-lg"
                >
                  {o.processed ? "Označit jako čeká" : "Označit jako vyřízeno"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
