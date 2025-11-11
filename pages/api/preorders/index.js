// pages/api/preorders/index.js
import { supabase } from "../../../utils/supabaseClient";

export default async function handler(req, res) {
  // ✅ vytvoření nové předobjednávky
  if (req.method === "POST") {
    const {
      customer_name,
      email,
      phone,
      standard_quantity,
      low_chol_quantity,
      pickup_date,
      pickup_location,
    } = req.body;

    const totalInOrder = Number(standard_quantity) + Number(low_chol_quantity);

    // ✅ Limit na jednu objednávku max 20 ks
    if (totalInOrder > 20) {
      return res.status(400).json({ error: "Maximální počet v jedné předobjednávce je 20 ks." });
    }

    // ✅ Sečteme všechny aktivní předobjednávky
    const { data: sumData, error: sumErr } = await supabase
      .from("preorders")
      .select("standard_quantity, low_chol_quantity")
      .eq("status", "předobjednávka");

    if (sumErr) {
      return res.status(500).json({ error: "Chyba při načítání předobjednávek." });
    }

    const totalExisting = sumData.reduce(
      (sum, row) => sum + Number(row.standard_quantity) + Number(row.low_chol_quantity),
      0
    );

    if (totalExisting + totalInOrder > 100) {
      return res.status(400).json({
        error: `Nelze vytvořit předobjednávku — zbývá pouze ${100 - totalExisting} ks.`,
      });
    }

    // ✅ Uložíme předobjednávku
    const { data, error } = await supabase
      .from("preorders")
      .insert([
        {
          customer_name,
          email,
          phone,
          standard_quantity,
          low_chol_quantity,
          pickup_date,
          pickup_location,
          status: "předobjednávka",
        },
      ])
      .select("*");

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ preorder: data[0] });
  }

  // ✅ načtení předobjednávek
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("preorders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ preorders: data });
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
