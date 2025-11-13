import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("=== CONFIRM START ===");

    const { id } = req.body;
    console.log("➡️ Preorder ID:", id);

    // 1️⃣ Načteme předobjednávku
    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    console.log("📌 PREORDER LOADED:", preorder);
    console.log("📌 loadErr:", loadErr);

    if (loadErr) throw loadErr;
    if (!preorder) throw new Error("Preorder not found");

    // 2️⃣ Spočítáme cenu
    const totalPrice = preorder.standardQty * 5 + preorder.lowcholQty * 7;
    console.log("💰 Total price:", totalPrice);

    // 3️⃣ Vložíme objednávku do orders
    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        standard_quantity: preorder.standardQty,
        low_chol_quantity: preorder.lowcholQty,

        // ⚠️ DŮLEŽITÉ – musí sedět přesný název sloupce
        pickup_location: preorder.pickuplocation,

        pickup_date: null,
        payment_total: totalPrice,
        payment_currency: "CZK",
        status: "nová objednávka",
        paid: false,
      },
    ]);

    if (insertErr) {
      console.error("📌 InsertErr:", insertErr);
      throw insertErr;
    }

    // 4️⃣ Aktualizujeme předobjednávku na potvrzenou
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("🔥 CONFIRM ERROR FULL:", err);

    return res.status(500).json({
      error: "Failed to confirm preorder",
      details: err.message,
      full: err    // ← přidá celý objekt chyby
    });
  }
}
