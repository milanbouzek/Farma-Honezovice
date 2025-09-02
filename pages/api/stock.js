import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({
      standardQuantity: data?.standard_quantity || 0,
      lowCholQuantity: data?.low_chol_quantity || 0,
    });
  } catch (err) {
    console.error("Stock API error:", err);
    res.status(500).json({ standardQuantity: 0, lowCholQuantity: 0 });
  }
}
