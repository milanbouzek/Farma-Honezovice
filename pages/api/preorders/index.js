import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Pouze GET povolen" });
  }

  try {
    // 🔥 počítáme pouze předobjednávky, které mají status "čeká"
    const { data, error } = await supabase
      .from("preorders")
      .select("*")
      .eq("status", "čeká")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 🔥 správný výpočet počtu vajec
    const total = data.reduce(
      (sum, row) => sum + (row.standardQty || 0) + (row.lowcholQty || 0),
      0
    );

    res.status(200).json({
      preorders: data,
      total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
