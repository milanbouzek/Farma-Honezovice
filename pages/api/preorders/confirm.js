import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  console.log("=== CONFIRM START ===");

  if (req.method !== "POST") {
    console.log("❌ Wrong method");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;
    console.log("➡️ Preorder ID:", id);

    // 1️⃣ Načíst předobjednávku
    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    console.log("📌 PREORDER LOADED:", preorder);
    console.log("📌 loadErr:", loadErr);

    if (loadErr) throw new Error("Load error: " + loadErr.message);
    if (!preorder) throw new Error("Preorder not found");

    // 2️⃣ Spočítat cenu
    const totalPrice = preorder.standardQty * 5 + preorder.lowcholQty * 7;
    console.log("💰 Total price:", totalPrice);

    // 3️⃣ Vložit do orders
    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        standard_quantity: preorder.standardQty,
        low_chol_quantity: preorder.lowcholQty,
        pickup_location: preorder.pickupLocation,
        pickup_date: null, // !!! Pokud je povinné, tady to spadne !!!
        payment_total: totalPrice,
        payment_currency: "CZK",
        status: "new",
        paid: false,
      },
    ]);

    console.log("📌 InsertErr:", insertErr);

    if (insertErr) throw new Error("Insert error: " + insertErr.message);

    // 4️⃣ Aktualizace statusu v preorders
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    console.log("📌 UpdateErr:", updateErr);

    if (updateErr) throw new Error("Update error: " + updateErr.message);

    console.log("=== CONFIRM DONE ===");

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("🔥 CONFIRM ERROR:", err);
    return res.status(500).json({ error: "Failed to confirm preorder", details: err.message });
  }
}
