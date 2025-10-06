// pages/admin/produkcevajec.js
import AdminLayout from "../../components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function ProdukceVajec() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [quantity, setQuantity] = useState("");
  const [records, setRecords] = useState([]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("daily_eggs") // ✅ správný název tabulky
      .select("*")
      .order("date", { ascending: false });

    if (error) toast.error("Chyba při načítání dat: " + error.message);
    else setRecords(data || []);
  };

  const addRecord = async () => {
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      toast.error("Zadej platný počet vajec");
      return;
    }
    const { error } = await supabase
      .from("daily_eggs") // ✅ také tady
      .insert([{ date, quantity: parseInt(quantity, 10) }]);
    if (error) toast.error("Nepodařilo se uložit: " + error.message);
    else {
      toast.success("✅ Uloženo");
      setQuantity("");
      fetchRecords();
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📊 Produkce vajec</h1>

      {/* Formulář pro zadání vajec */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <label className="block mb-2 font-semibold">Datum:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded p-2 mb-4 w-full"
        />
        <label className="block mb-2 font-semibold">Počet vajec:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="border rounded p-2 mb-4 w-full"
          placeholder="Zadej počet vajec"
        />
        <button
          onClick={addRecord}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Uložit
        </button>
      </div>

      {/* Tabulka záznamů */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">📅 Historie produkce</h2>
        {records.length === 0 ? (
          <p>Žádné záznamy</p>
        ) : (
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Datum</th>
                <th className="p-2 text-left">Počet vajec</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.date}</td>
                  <td className="p-2">{r.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
