console.log("Received body:", req.body);
console.log("Parsed quantities:", Number(req.body.standardQty), Number(req.body.lowcholQty));

import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      email,
      phone,
      pickupLocation,
      standardQty,
      lowcholQty,
      note,
    } = req.body;

    // Povinná pole
    if (!name || !pickupLocation) {
      return res.status(400).json({ error: "Chybí povinné údaje" });
    }

    const standard = parseInt(standardQty || 0, 10);
    const lowchol = parseInt(lowcholQty || 0, 10);
    const totalOrder = standard + lowchol;

    // Validace počtu vajec
    if (totalOrder < 10) {
      return res.status(400).json({
        error: "Minimální objednávka je 10 ks.",
      });
    }
    if (totalOrder % 10 !== 0) {
      return res.status(400).json({
        error: "Počet vajec musí být násobek 10.",
      });
    }
    if (totalOrder > 20) {
      return res.status(400).json({
        error: "Maximálně 20 ks na jednu předobjednávku.",
      });
    }

    // Celkový limit 100 ks
    const { data: totalData, error: totalErr } = await supabase
      .from("preorders")
      .select("standardQty, lowcholQty");

    if (totalErr) throw totalErr;

    const totalCurrent = totalData.reduce(
      (sum, o) => sum + (o.standardQty || 0) + (o.lowcholQty || 0),
      0
    );

    if (totalCurrent + totalOrder > 100) {
      return res.status(400).json({
        error: `Celkový limit 100 ks překročen. Aktuálně dostupných ${
          100 - totalCurrent
        } ks.`,
      });
    }

    // Vložení do databáze
    const { error: insertErr } = await supabase.from("preorders").insert([
      {
        name,
        email: email || null,
        phone: phone || null,
        pickupLocation,
        standardQty: standard,
        lowcholQty: lowchol,
        note: note || null,
        created_at: new Date().toISOString(),
        status: "čeká na potvrzení",
      },
    ]);

    if (insertErr) throw insertErr;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při vytváření předobjednávky:", err);
    return res
      .status(500)
      .json({ error: "Chyba při vytváření předobjednávky" });
  }
}
