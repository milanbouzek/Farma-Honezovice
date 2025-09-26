import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
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
    }

    if (req.method === "POST") {
      const { standardQuantity, lowCholQuantity } = req.body;

      if (
        standardQuantity === undefined ||
        lowCholQuantity === undefined
      ) {
        return res.status(400).json({ error: "Chybí hodnoty skladu" });
      }

      if (standardQuantity < 0 || lowCholQuantity < 0) {
        return res.status(400).json({ error: "Hodnoty musí být >= 0" });
      }

      const { data, error } = await supabaseServer
        .from("eggs_stock")
        .update({
          standard_quantity: standardQuantity,
          low_chol_quantity: lowCholQuantity,
        })
        .eq("id", 1) // předpokládám, že máš jeden záznam
        .select("standard_quantity, low_chol_quantity")
        .single();

      if (error) throw error;

      return res.status(200).json({
        standardQuantity: data.standard_quantity,
        lowCholQuantity: data.low_chol_quantity,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Stock API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
