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
        return res.status(200).json({
          stock: { standard_quantity: 0, low_chol_quantity: 0 },
        });
      }

      return res.status(200).json({
        stock: {
          standard_quantity: data.standard_quantity,
          low_chol_quantity: data.low_chol_quantity,
        },
      });
    }

    if (req.method === "POST") {
      const { standard_quantity, low_chol_quantity } = req.body;

      if (
        standard_quantity === undefined ||
        low_chol_quantity === undefined
      ) {
        return res.status(400).json({ error: "Chybí hodnoty skladu" });
      }

      if (standard_quantity < 0 || low_chol_quantity < 0) {
        return res.status(400).json({ error: "Hodnoty musí být >= 0" });
      }

      const { data, error } = await supabaseServer
        .from("eggs_stock")
        .update({
          standard_quantity,
          low_chol_quantity,
        })
        .eq("id", 1) // předpoklad: máš jen jeden záznam
        .select("standard_quantity, low_chol_quantity")
        .single();

      if (error) throw error;

      return res.status(200).json({
        stock: {
          standard_quantity: data.standard_quantity,
          low_chol_quantity: data.low_chol_quantity,
        },
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Stock API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
