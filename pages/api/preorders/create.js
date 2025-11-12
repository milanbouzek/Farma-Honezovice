import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, phone, pickupLocation, standardQty, lowcholQty } = req.body;

    // Ověření vstupů
    if (!name || !pickupLocation) {
      return res.status(400).json({ error: "Chybí povinné údaje" });
    }

    const standard = parseInt(standardQty || 0, 10);
    const lowchol = parseInt(lowcholQty || 0, 10);
    const totalOrder = standard + lowchol;

    // Limit na jednu objednávku
    const MAX_PER_ORDER = 20;
    const MAX_TOTAL = 100;

    if (totalOrder <= 0) {
      return res.status(400).json({ error: "Musíte objednat alespoň 1 vejce" });
    }

    if (totalOrder > MAX_PER_ORDER) {
      return res
        .status(400)
        .json({ error: `Maximálně ${MAX_PER_ORDER} ks na jednu objednávku.` });
    }

    // Získání aktuálního součtu všech předobjednávek
    const { data: totalData, error: totalErr } = await supabase
      .from("preorders")
      .select("standardQty, lowcholQty");

    if (totalErr) throw totalErr;

    const totalCurrent = totalData.reduce(
      (sum, o) => sum + (o.standardQty || 0) + (o.lowcholQty || 0),
      0
    );

    if (totalCurrent + totalOrder > MAX_TOTAL) {
      return res.status(400).json({
        error: `Celkový limit ${MAX_TOTAL} ks překročen. Aktuálně dostupných ${
          MAX_TOTAL - totalCurrent
        } ks.`,
      });
    }

    // Uložení nové předobjednávky
    const { error: insertErr } = await supabase.from("preorders").insert([
      {
        name,
        email,
        phone,
        pickupLocation,
        standardQty: standard,
        lowcholQty: lowchol,
        created_at: new Date().toISOString(),
        status: "čeká na potvrzení",
      },
    ]);

    if (insertErr) throw insertErr;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při vytváření předobjednávky:", err);
    return res.status(500).json({ error: "Chyba při vytváření předobjednávky" });
  }
}
