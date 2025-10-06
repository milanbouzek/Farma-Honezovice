// pages/admin/produkcevajec.js
import AdminLayout from "../../components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";

export default function ProdukceVajec() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [standard, setStandard] = useState("");
  const [lowChol, setLowChol] = useState("");
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editStandard, setEditStandard] = useState("");
  const [editLowChol, setEditLowChol] = useState("");

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("daily_eggs")
      .select("*")
      .order("date", { ascending: false });

    if (error) toast.error("❌ Chyba při načítání dat");
    else setRecords(data || []);
  };

  const addRecord = async () => {
    if ((!standard && !lowChol) || (standard < 0 || lowChol < 0)) {
      toast.error("Zadej platné počty vajec");
      return;
    }

    const { error } = await supabase.from("daily_eggs").insert([
      {
        date,
        standard_eggs: parseInt(standard || 0, 10),
        lowchol_eggs: parseInt(lowChol || 0, 10),
      },
    ]);

    if (error) toast.error("❌ Nepodařilo se uložit");
    else {
      toast.success("✅ Záznam uložen");
      setStandard("");
      setLowChol("");
      fetchRecords();
    }
  };

  const deleteRecord = async (id) => {
    const { error } = await supabase.from("daily_eggs").delete().eq("id", id);
    if (error) toast.error("❌ Nepodařilo se smazat záznam");
    else {
      toast.success("🗑️ Záznam odstraněn");
      fetchRecords();
    }
  };

  const startEditing = (record) => {
    setEditingId(record.id);
    setEditStandard(record.standard_eggs);
    setEditLowChol(record.lowchol_eggs);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStandard("");
    setEditLowChol("");
  };

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from("daily_eggs")
      .update({
        standard_eggs: parseInt(editStandard || 0, 10),
        lowchol_eggs: parseInt(editLowChol || 0, 10),
      })
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      toast.error("❌ Nepodařilo se upravit záznam");
    } else {
      toast.success("✏️ Záznam upraven");
      setEditingId(null);
      fetchRecords();
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">📊 Produkce vajec</h1>

      {/* Přidávací formulář */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Přidat denní produkci</h2>
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
            className="border p-2 rounded w-36"
          />
          <input
            type="number"
            placeholder="LowChol vejce"
            value={lowChol}
            onChange={(e) => setLowChol(e.target.value)}
            className="border p-2 rounded w-36"
          />
          <button
            onClick={addRecord}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            💾 Uložit
          </button>
        </div>
      </div>

      {/* Tabulka historie */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-semibold mb-4">Historie produkce</h2>
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-left">Standardní vejce</th>
              <th className="p-2 text-left">LowChol vejce</th>
              <th className="p-2 text-right">Akce</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.date}</td>

                {editingId === r.id ? (
                  <>
                    <td className="p-2">
                      <input
                        type="number"
                        value={editStandard}
                        onChange={(e) => setEditStandard(e.target.value)}
                        className="border p-1 rounded w-24"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={editLowChol}
                        onChange={(e) => setEditLowChol(e.target.value)}
                        className="border p-1 rounded w-24"
                      />
                    </td>
                    <td className="p-2 text-right space-x-2">
                      <button
                        onClick={() => saveEdit(r.id)}
                        className="text-green-600 hover:underline"
                      >
                        💾 Uložit
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-500 hover:underline"
                      >
                        Zrušit
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{r.standard_eggs}</td>
                    <td className="p-2">{r.lowchol_eggs}</td>
                    <td className="p-2 text-right space-x-2">
                      <button
                        onClick={() => startEditing(r)}
                        className="text-blue-500 hover:underline"
                      >
                        ✏️ Upravit
                      </button>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="text-red-500 hover:underline"
                      >
                        Smazat
                      </button>
                    </td>
                  </>
                )}
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
