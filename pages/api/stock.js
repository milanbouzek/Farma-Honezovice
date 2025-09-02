import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    const { data: stock, error } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .single();

    if (error) throw error;

    res.status(200).json({
      standardQuantity: stock.standard_quantity || 0,
      lowCholQuantity: stock.low_chol_quantity || 0,
    });
  } catch (err) {
    console.error("Stock API error:", err);
    res.status(500).json({ standardQuantity: 0, lowCholQuantity: 0 });
  }
}
