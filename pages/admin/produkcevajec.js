import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabaseClient";

export default function ProdukceVajecPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [standard, setStandard] = useState("");
  const [lowChol, setLowChol] = useState("");
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("daily_eggs")
      .select("*")
      .order("date", { ascending: false });
    if (error) toast.error("Chyba při načítání dat");
    else setRecords(data);
  };

  const addRecord = async () => {
    if ((!standard || isNaN(standard)) && (!lowChol || isNaN(lowChol))) {
      toast.error("Zadej počet vajec");
      return;
    }

    const { error } = await supabase.from("daily_eggs").insert([
      {
        date,
        standard_eggs: parseInt(standard || 0, 10),
        low_cholesterol_eggs: parseInt(lowChol || 0, 10),
      },
    ]);

    if (error) toast.error("Nepodařilo se uložit");
    else {
      toast.success("✅ Záznam uložen");
      setStandard("");
      setLowChol("");
      fetchRecords();
    }
  };

  const deleteRecord = async (id) => {
    const { error } = await supabase.from("daily_eggs").delete().eq("id", id);
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
      standard_eggs: record.standard_eggs,
      low_cholesterol_eggs: record.low_cholesterol_eggs,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from("daily_eggs")
      .update({
        date: editingData.date,
        standard_eggs: parseInt(editingData.standard_eggs || 0, 10),
        low_cholesterol_eggs: parseInt(editingData.low_cholesterol_eggs || 0, 10),
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
      <h1 className="text-3xl font-bold mb-6">🥚 Denní produkce vajec</h1>

      {/* Přidat záznam */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Přidat záznam</h2>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Standardní vejce"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="border p-2 rounded w-40"
          />
          <input
            type="number"
            placeholder="Vejce se sníženým cholesterolem"
            value={lowChol}
            onChange={(e) => setLowChol(e.target.value)}
            className="border p-2 rounded w-64"
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
        <h2 className="text-xl font-semibold mb-4">Historie produkce</h2>
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-left">Standardní vejce</th>
              <th className="p-2 text-left">Nízký cholesterol</th>
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
                      value={editingData.standard_eggs}
                      onChange={(e) =>
                        setEditingData({ ...editingData, standard_eggs: e.target.value })
                      }
                      className="border p-1 rounded w-20"
                    />
                  ) : (
                    r.standard_eggs
                  )}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <input
                      type="number"
                      value={editingData.low_cholesterol_eggs}
                      onChange={(e) =>
                        setEditingData({ ...editingData, low_cholesterol_eggs: e.target.value })
                      }
                      className="border p-1 rounded w-24"
                    />
                  ) : (
                    r.low_cholesterol_eggs
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
