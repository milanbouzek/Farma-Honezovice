import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    const { data: stock, error } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .single();

    if (error) throw error;

    res.status(200).json({
      standard: stock.standard_quantity,
      lowChol: stock.low_chol_quantity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
