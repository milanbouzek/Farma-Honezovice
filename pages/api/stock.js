import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Načtení zásob
      const { data: stockData, error: stockError } = await supabaseServer
        .from("eggs_stock")
        .select("standard_quantity, low_chol_quantity")
        .eq("id", 1)
        .maybeSingle();
      if (stockError) throw stockError;

      // Načtení cen
      const { data: priceData, error: priceError } = await supabaseServer
        .from("eggs_prices")
        .select("standard_price, low_chol_price")
        .eq("id", 1)
        .maybeSingle();
      if (priceError) throw priceError;

      return res.status(200).json({
        standardQuantity: stockData?.standard_quantity || 0,
        lowCholQuantity: stockData?.low_chol_quantity || 0,
        standardPrice: priceData?.standard_price || 0,
        lowCholPrice: priceData?.low_chol_price || 0,
      });
    }

    if (req.method === "POST") {
      const {
        standardQuantity,
        lowCholQuantity,
        standardPrice,
        lowCholPrice,
      } = req.body;

      // Validace
      if (
        standardQuantity === undefined ||
        lowCholQuantity === undefined ||
        standardPrice === undefined ||
        lowCholPrice === undefined
      ) {
        return res.status(400).json({ error: "Chybí hodnoty skladu nebo ceny" });
      }

      if (
        standardQuantity < 0 || lowCholQuantity < 0 ||
        standardPrice < 0 || lowCholPrice < 0
      ) {
        return res.status(400).json({ error: "Hodnoty musí být >= 0" });
      }

      // Aktualizace zásob
      const { data: stockUpdated, error: stockUpdateError } = await supabaseServer
        .from("eggs_stock")
        .update({
          standard_quantity: standardQuantity,
          low_chol_quantity: lowCholQuantity,
        })
        .eq("id", 1)
        .select()
        .single();
      if (stockUpdateError) throw stockUpdateError;

      // Aktualizace cen
      const { data: priceUpdated, error: priceUpdateError } = await supabaseServer
        .from("eggs_prices")
        .update({
          standard_price: standardPrice,
          low_chol_price: lowCholPrice,
        })
        .eq("id", 1)
        .select()
        .single();
      if (priceUpdateError) throw priceUpdateError;

      return res.status(200).json({
        standardQuantity: stockUpdated.standard_quantity,
        lowCholQuantity: stockUpdated.low_chol_quantity,
        standardPrice: priceUpdated.standard_price,
        lowCholPrice: priceUpdated.low_chol_price,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Stock API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
