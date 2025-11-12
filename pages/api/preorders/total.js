import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from("preorders")
      .select("standardQty, lowcholQty");

    if (error) throw error;

    const total = data.reduce(
      (sum, item) => sum + (item.standardQty || 0) + (item.lowcholQty || 0),
      0
    );

    return res.status(200).json({ total });
  } catch (err) {
    console.error("❌ Chyba při získávání celkového počtu předobjednávek:", err);
    return res.status(500).json({ error: "Chyba při získávání součtu" });
  }
}
