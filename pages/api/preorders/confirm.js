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

    if (loadErr) throw loadErr;
    if (!preorder) throw new Error("Preorder not found");

    // 2️⃣ Kontrola pickup location (musí existovat)
    if (!preorder.pickuplocation || preorder.pickuplocation.trim() === "") {
      throw new Error("Pickup location is missing in preorder.");
    }

    // 3️⃣ Cena
    const totalPrice = preorder.standardQty * 5 + preorder.lowcholQty * 7;
    console.log("💰 Total price:", totalPrice);

    // 4️⃣ Vložíme do orders
    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        standard_quantity: preorder.standardQty,
        low_chol_quantity: preorder.lowcholQty,

        // 👍 Fallback pro jistotu
        pickup_location: preorder.pickuplocation || "neuvedeno",

        pickup_date: null,
        payment_total: totalPrice,
        payment_currency: "CZK",

        // musí být toto, jinak se nezobrazí v adminu
        status: "nová objednávka",

        paid: false,
      },
    ]);

    if (insertErr) throw insertErr;

    // 5️⃣ Update preorder
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("🔥 CONFIRM ERROR:", err);
    return res.status(500).json({
      error: "Failed to confirm preorder",
      details: err.message,
    });
  }
}
