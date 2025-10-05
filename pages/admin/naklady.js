import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function NakladyPage() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      toast.error("Chyba při načítání nákladů");
    } else {
      setExpenses(data);
    }
  };

  const addExpense = async () => {
    if (!amount || !date) {
      toast.error("Vyplň částku a datum");
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .insert([{ amount: parseFloat(amount), description, date }]);

    if (error) {
      toast.error("Nepodařilo se přidat náklad");
    } else {
      toast.success("✅ Náklad přidán");
      setAmount("");
      setDescription("");
      setDate("");
      fetchExpenses();
    }
  };

  const deleteExpense = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Nepodařilo se smazat náklad");
    } else {
      toast.success("🗑️ Náklad odstraněn");
      fetchExpenses();
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📉 Náklady</h1>

      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Přidat nový náklad</h2>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <input
            type="number"
            placeholder="Částka (Kč)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 rounded w-32"
          />
          <input
            type="text"
            placeholder="Popis"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={addExpense}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            💾 Uložit
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-semibold mb-4">Seznam nákladů</h2>
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-left">Popis</th>
              <th className="p-2 text-right">Částka (Kč)</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="p-2">{e.date}</td>
                <td className="p-2">{e.description || "-"}</td>
                <td className="p-2 text-right">{e.amount}</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => deleteExpense(e.id)}
                    className="text-red-500 hover:underline"
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
