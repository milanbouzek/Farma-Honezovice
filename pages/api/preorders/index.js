// pages/api/preorders/index.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Pouze GET povolen" });
  }

  try {
    // Načteme všechny předobjednávky, které nejsou potvrzené (status != 'potvrzená')
    const { data, error } = await supabase
      .from("preorders")
      .select("*")
      .neq("status", "potvrzená")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Spočítáme celkem ks = standardQty + lowcholQty
    const total = (data || []).reduce((sum, row) => {
      const s = Number(row.standardQty || 0);
      const l = Number(row.lowcholQty || 0);
      return sum + s + l;
    }, 0);

    res.status(200).json({
      preorders: data,
      total,
    });
  } catch (err) {
    console.error("Preorders index error:", err);
    res.status(500).json({ error: err.message });
  }
}
