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
    const { data, error } = await supabase.from("eggs_production").select("*").order("date", { ascending: false });
    if (error) toast.error("Chyba při načítání dat");
    else setRecords(data || []);
  };

  const addRecord = async () => {
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      toast.error("Zadej platný počet vajec");
      return;
    }
    const { error } = await supabase.from("eggs_production").insert([{ date, quantity: parseInt(quantity, 10) }]);
    if (error) toast.error("Nepodařilo se uložit");
    else { toast.success("✅ Uloženo"); setQuantity(""); fetchRecords(); }
  };

  useEffect(() => { fetchRecords(); }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📊 Produkce vajec</h1>
      {/* formulář a tabulka jako máš */}
    </AdminLayout>
  );
}
