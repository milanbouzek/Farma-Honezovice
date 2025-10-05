import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabaseClient";

export default function DailyEggsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [eggs, setEggs] = useState([]);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) setAuthenticated(true);
    else toast.error("❌ Špatné heslo");
  };

  const fetchEggs = async () => {
    const { data, error } = await supabase
      .from("daily_eggs")
      .select("*")
      .order("date", { ascending: false });
    if (error) toast.error("Chyba při načítání dat");
    else setEggs(data);
  };

  const addEggs = async () => {
    if (!quantity || !date) {
      toast.error("Vyplň datum a počet vajec");
      return;
    }

    const { error } = await supabase
      .from("daily_eggs")
      .insert([{ date, quantity: parseInt(quantity), notes }]);

    if (error) toast.error("Nepodařilo se uložit počet vajec");
    else {
      toast.success("✅ Počet vajec uložen");
      setQuantity("");
      setNotes("");
      fetchEggs();
    }
  };

  const deleteEggs = async (id) => {
    const { error } = await supabase.from("daily_eggs").delete().eq("id", id);
    if (error) toast.error("Nepodařilo se smazat záznam");
    else {
      toast.success("🗑️ Záznam smazán");
      fetchEggs();
    }
  };

  useEffect(() => {
    if (authenticated) fetchEggs();
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
        <input
          type="password"
          placeholder="Zadejte heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded mb-2 w-64"
        />
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">🥚 Denní počet vajec</h1>

      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Přidat nový záznam</h2>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Počet vajec"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border p-2 rounded w-32"
          />
          <input
            type="text"
            placeholder="Poznámky"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={addEggs}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            💾 Uložit
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-semibold mb-4">Seznam záznamů</h2>
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-left">Počet vajec</th>
              <th className="p-2 text-left">Poznámky</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {eggs.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="p-2">{e.date}</td>
                <td className="p-2">{e.quantity}</td>
                <td className="p-2">{e.notes || "-"}</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => deleteEggs(e.id)}
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
