import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabaseClient";

export default function NakladyPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

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

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditingData({
      date: record.date,
      amount: record.amount,
      description: record.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const saveEdit = async (id) => {
    if (!editingData.amount || isNaN(editingData.amount) || editingData.amount <= 0) {
      toast.error("Zadej platnou částku");
      return;
    }
    if (!editingData.description.trim()) {
      toast.error("Zadej popis nákladu");
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .update({
        date: editingData.date,
        amount: parseFloat(editingData.amount),
        description: editingData.description,
      })
      .eq("id", id);

    if (error) toast.error("Nepodařilo se upravit záznam");
    else {
      toast.success("✅ Záznam upraven");
      setEditingId(null);
      setEditingData({});
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

      {/* Přidat záznam */}
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

      {/* Historie záznamů */}
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
                <td className="p-2">
                  {editingId === r.id ? (
                    <input
                      type="date"
                      value={editingData.date}
                      onChange={(e) => setEditingData({ ...editingData, date: e.target.value })}
                      className="border p-1 rounded w-32"
                    />
                  ) : (
                    r.date
                  )}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <input
                      type="number"
                      value={editingData.amount}
                      onChange={(e) => setEditingData({ ...editingData, amount: e.target.value })}
                      className="border p-1 rounded w-32"
                    />
                  ) : (
                    r.amount
                  )}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <input
                      type="text"
                      value={editingData.description}
                      onChange={(e) =>
                        setEditingData({ ...editingData, description: e.target.value })
                      }
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    r.description
                  )}
                </td>
                <td className="p-2 text-right">
                  {editingId === r.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(r.id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600"
                      >
                        💾 Uložit
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
                      >
                        ❌ Zrušit
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(r)}
                        className="text-blue-500 hover:underline mr-2"
                      >
                        ✏️ Upravit
                      </button>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="text-red-500 hover:underline"
                      >
                        Smazat
                      </button>
                    </>
                  )}
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
