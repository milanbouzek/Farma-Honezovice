import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabaseClient";

export default function NakladyPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [records, setRecords] = useState([]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
    if (error) toast.error("Chyba při načítání dat");
    else setRecords(data);
  };

  const addRecord = async () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error("Zadej platnou částku");
      return;
    }
    if (!description.trim()) {
      toast.error("Zadej popis nákladu");
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .insert([{ date, amount: parseFloat(amount), description }]);

    if (error) toast.error("Nepodařilo se uložit");
    else {
      toast.success("✅ Záznam uložen");
      setAmount("");
      setDescription("");
      fetchRecords();
    }
  };

  const deleteRecord = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) toast.error("Nepodařilo se smazat");
    else {
      toast.success("🗑️ Záznam odstraněn");
      fetchRecords();
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📉 Náklady</h1>

      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Přidat náklad</h2>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Částka"
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
          <button
            onClick={addRecord}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            💾 Uložit
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-semibold mb-4">Historie nákladů</h2>
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-left">Částka</th>
              <th className="p-2 text-left">Popis</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.date}</td>
                <td className="p-2">{r.amount}</td>
                <td className="p-2">{r.description}</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => deleteRecord(r.id)}
                    className="text-red-500 hover:underline"
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan="4" className="p-2 italic text-gray-500 text-center">
                  Žádné záznamy
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
