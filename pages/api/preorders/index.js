// pages/api/preorders/index.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Pouze GET povolen" });
  }

  try {
    const { data, error } = await supabase
      .from("preorders")
      .select("id, standardQty, lowcholQty, status, converted, name, email, phone, pickupdate, pickuplocation, note, created_at")
      .eq("converted", false)        // jen nepřevedené
      .eq("status", "čeká")         // jen čekající
      .order("created_at", { ascending: true });

    if (error) throw error;

    const total = (data || []).reduce((sum, row) => {
      return sum + Number(row.standardQty || 0) + Number(row.lowcholQty || 0);
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
