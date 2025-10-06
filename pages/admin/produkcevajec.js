import AdminLayout from "../../components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function ProdukceVajec() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [standardEggs, setStandardEggs] = useState("");
  const [lowCholEggs, setLowCholEggs] = useState("");
  const [records, setRecords] = useState([]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("daily_eggs")
      .select("*")
      .order("date", { ascending: false });
    if (error) toast.error("Chyba při načítání dat");
    else setRecords(data || []);
  };

  const addRecord = async () => {
    if ((!standardEggs && !lowCholEggs) || isNaN(standardEggs) || isNaN(lowCholEggs) || standardEggs < 0 || lowCholEggs < 0) {
      toast.error("Zadej platné počty vajec");
      return;
    }

    const { error } = await supabase.from("daily_eggs").insert([{
      date,
      standard_eggs: parseInt(standardEggs, 10),
      low_chol_eggs: parseInt(lowCholEggs, 10)
    }]);

    if (error) toast.error("Nepodařilo se uložit");
    else {
      toast.success("✅ Uloženo");
      setStandardEggs("");
      setLowCholEggs("");
      fetchRecords();
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📊 Produkce vajec</h1>

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
            placeholder="Počet standardních vajec"
            value={standardEggs}
            onChange={(e) => setStandardEggs(e.target.value)}
            className="border p-2 rounded w-40"
          />
          <input
            type="number"
            placeholder="Počet vajec s nízkým cholesterolem"
            value={lowCholEggs}
            onChange={(e) => setLowCholEggs(e.target.value)}
            className="border p-2 rounded w-40"
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
        <h2 className="text-xl font-semibold mb-4">Historie produkce</h2>
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-left">Standardní</th>
              <th className="p-2 text-left">Nízký cholesterol</th>
              <th className="p-2 text-left">Celkem</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.date}</td>
                <td className="p-2">{r.standard_eggs}</td>
                <td className="p-2">{r.low_chol_eggs}</td>
                <td className="p-2">{(r.standard_eggs || 0) + (r.low_chol_eggs || 0)}</td>
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
