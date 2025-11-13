import { supabase } from "@/lib/supabaseClient";

function isValidDateString(d) {
  if (!d) return false;
  const dt = new Date(d);
  return !Number.isNaN(dt.getTime());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("=== CONFIRM START ===");
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing preorder id" });

    // 1) načteme předobjednávku
    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    console.log("📌 PREORDER LOADED:", preorder, "loadErr:", loadErr);
    if (loadErr) throw loadErr;
    if (!preorder) return res.status(404).json({ error: "Preorder not found" });

    // Ujistíme se, že má datum
    const pickupDateStr = preorder.pickupdate || preorder.pickupDate || preorder.pickup_date;
    if (!pickupDateStr || !isValidDateString(pickupDateStr)) {
      return res.status(400).json({ error: "Preorder nemá platné datum vyzvednutí." });
    }

    // 2) spočítáme cenu
    const totalPrice = (Number(preorder.standardQty || 0) * 5) + (Number(preorder.lowcholQty || 0) * 7);
    console.log("💰 Total price:", totalPrice);

    // 3) vložíme do orders (zajistíme, že naplníme pickup_date)
    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email || null,
        phone: preorder.phone || null,
        standard_quantity: Number(preorder.standardQty || 0),
        low_chol_quantity: Number(preorder.lowcholQty || 0),

        // pickup_location v orders očekává not-null — použijeme hodnotu z preorders
        pickup_location: preorder.pickuplocation || preorder.pickupLocation || null,

        // pickup_date musí být NOT NULL v orders — použijeme datum z preorders
        pickup_date: pickupDateStr, // pokud je string "YYYY-MM-DD", Supabase/Postgres to převede

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

    // 4) změnit status předobjednávky na potvrzená
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    if (updateErr) {
      console.error("Update preorder status err:", updateErr);
      throw updateErr;
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("🔥 CONFIRM ERROR:", err);
    return res.status(500).json({
      error: "Failed to confirm preorder",
      details: err.message || err,
      full: err,
    });
  }
}
