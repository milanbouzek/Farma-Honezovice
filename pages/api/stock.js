import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Načtení skladu
      const { data: stock, error: stockError } = await supabaseServer
        .from("eggs_stock")
        .select("id, standard_quantity, low_chol_quantity")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (stockError) throw stockError;

      // Načtení cen
      const { data: prices, error: priceError } = await supabaseServer
        .from("eggs_prices")
        .select("id, standard_price, low_chol_price")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (priceError) throw priceError;

      return res.status(200).json({ stock, prices });
    }

    if (req.method === "POST") {
      const {
        standardQuantity,
        lowCholQuantity,
        standardPrice,
        lowCholPrice,
      } = req.body;

      // Aktualizace skladu
      let updatedStock = null;
      if (standardQuantity !== undefined || lowCholQuantity !== undefined) {
        const { data, error } = await supabaseServer
          .from("eggs_stock")
          .update({
            standard_quantity: standardQuantity,
            low_chol_quantity: lowCholQuantity,
          })
          .order("id", { ascending: true })
          .limit(1)
          .select("*")
          .single();

        if (error) throw error;
        updatedStock = data;
      }

      // Aktualizace cen
      let updatedPrices = null;
      if (standardPrice !== undefined || lowCholPrice !== undefined) {
        const { data, error } = await supabaseServer
          .from("eggs_prices")
          .update({
            standard_price: standardPrice,
            low_chol_price: lowCholPrice,
          })
          .order("id", { ascending: true })
          .limit(1)
          .select("*")
          .single();

        if (error) throw error;
        updatedPrices = data;
      }

      return res.status(200).json({
        stock: updatedStock,
        prices: updatedPrices,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Stock API error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Chyba serveru při práci se skladem." });
  }
}
