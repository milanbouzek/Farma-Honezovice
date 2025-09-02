// /pages/api/stock.js
import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_cholesterol_quantity")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error("Stock API error:", err);
    return res.status(500).json({ error: "Chyba při načítání zásob." });
  }
}
