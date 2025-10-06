import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";

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
    if (!standard && !lowChol) {
      toast.error("Zadej alespoň jeden počet vajec");
      return;
    }

    const { error } = await supabase.from("daily_eggs").insert([
      {
        date,
        standard_eggs: parseInt(standard || 0, 10),
        low_cholesterol_eggs: parseInt(lowChol || 0, 10),
      },
    ]);

    if (error) toast.error("❌ Nepodařilo se uložit");
    else {
      toast.success("✅ Uloženo");
      setStandard("");
      setLowChol("");
      fetchRecords();
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditStandard(record.standard_eggs);
    setEditLowChol(record.low_cholesterol_eggs);
  };

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from("daily_eggs")
      .update({
        standard_eggs: parseInt(editStandard || 0, 10),
        low_cholesterol_eggs: parseInt(editLowChol || 0, 10),
      })
      .eq("id", id);

    if (error) toast.error("❌ Nepodařilo se upravit záznam");
    else {
      toast.success("✅ Záznam upraven");
      setEditingId(null);
      fetchRecords();
    }
  };

  const deleteRecord = async (id) => {
    const { error } = await supabase.from("daily_eggs").delete().eq("id", id);
    if (error) toast.error("❌ Nepodařilo se smazat");
    else {
      toast.success("🗑️ Smazáno");
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

      <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col sm:flex-row items-center gap-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded w-48"
        />
        <input
          type="number"
          placeholder="Standardní vejce"
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          className="border p-2 rounded w-48"
        />
        <input
          type="number"
          placeholder="Low Chol vejce"
          value={lowChol}
          onChange={(e) => setLowChol(e.target.value)}
          className="border p-2 rounded w-48"
        />
        <button
          onClick={addRecord}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Přidat záznam
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Datum</th>
              <th className="border p-2 text-left">Standardní vejce</th>
              <th className="border p-2 text-left">Low Chol vejce</th>
              <th className="border p-2 text-center">Akce</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="border p-2">{r.date}</td>

                {editingId === r.id ? (
                  <>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={editStandard}
                        onChange={(e) => setEditStandard(e.target.value)}
                        className="border p-1 rounded w-24"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={editLowChol}
                        onChange={(e) => setEditLowChol(e.target.value)}
                        className="border p-1 rounded w-24"
                      />
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => saveEdit(r.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2"
                      >
                        Uložit
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                      >
                        Zrušit
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-2">{r.standard_eggs}</td>
                    <td className="border p-2">{r.low_cholesterol_eggs}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => startEdit(r)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mr-2"
                      >
                        Upravit
                      </button>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Smazat
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
