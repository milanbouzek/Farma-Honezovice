import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("=== CONFIRM PREORDER ===");

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing preorder ID" });
    }

    // 1️⃣ Načíst předobjednávku
    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    console.log("📌 Loaded preorder:", preorder);

    if (loadErr) {
      console.error("❌ Load error:", loadErr);
      throw loadErr;
    }
    if (!preorder) throw new Error("Preorder not found");

    // 2️⃣ Přepočítat cenu
    const price =
      (preorder.standardQty || 0) * 5 +
      (preorder.lowcholQty || 0) * 7;

    // 3️⃣ Převést datum z tabulky (YYYY-MM-DD)
    const pickupDateISO = preorder.pickupdate; // uložené v DB jako text/date
    console.log("📅 pickupDate:", pickupDateISO);

    if (!pickupDateISO) {
      throw new Error("Preorder has no pickup date");
    }

    // 4️⃣ Vložit do tabulky orders
    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        standard_quantity: preorder.standardQty,
        low_chol_quantity: preorder.lowcholQty,
        pickup_location: preorder.pickuplocation,
        pickup_date: pickupDateISO, // <-- správné pole, správný formát ("2025-11-14")
        payment_total: price,
        payment_currency: "CZK",
        status: "nová objednávka",
        paid: false,
      },
    ]);

    if (insertErr) {
      console.error("❌ Insert error:", insertErr);
      throw insertErr;
    }

    // 5️⃣ Označit předobjednávku jako potvrzenou
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    if (updateErr) {
      console.error("❌ Update error:", updateErr);
      throw updateErr;
    }

    return res.status(200).json({
      success: true,
      message: "Preorder successfully converted into order",
    });
  } catch (err) {
    console.error("🔥 CONFIRM ERROR:", err);
    return res.status(500).json({
      error: "Failed to confirm preorder",
      details: err.message || err,
    });
  }
}
