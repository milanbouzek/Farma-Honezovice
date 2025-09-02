import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, error } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(200).json({ standardQuantity: 0, lowCholQuantity: 0 });
    }

    return res.status(200).json({
      standardQuantity: data.standard_quantity,
      lowCholQuantity: data.low_chol_quantity,
    });
  } catch (err) {
    console.error("Stock API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
