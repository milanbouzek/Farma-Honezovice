import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({
      standard: data?.standard_quantity || 0,
      lowChol: data?.low_chol_quantity || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
}
