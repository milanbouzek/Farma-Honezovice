import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing preorder ID" });

    // 1️⃣ Načtení předobjednávky
    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (loadErr || !preorder)
      return res.status(404).json({ error: "Předobjednávka nenalezena" });

    // 2️⃣ Výpočet pickup_date = dnes + 2 dny
    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + 2);

    // 3️⃣ Cena — podle klasického ceníku
    const price =
      preorder.standardQty * 5 + preorder.lowcholQty * 7;

    // 4️⃣ Vložení do orders
    const { error: insertErr } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: preorder.name,
          email: preorder.email,
          phone: preorder.phone,
          standard_quantity: preorder.standardQty,
          low_chol_quantity: preorder.lowcholQty,
          pickup_location: preorder.pickupLocation,
          pickup_date: pickupDate.toISOString().split("T")[0], // YYYY-MM-DD
          payment_total: price,
          payment_currency: "CZK",
          status: "new",
          paid: false,
        },
      ]);

    if (insertErr) throw insertErr;

    // 5️⃣ Změna stavu předobjednávky
    const { error: updErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    if (updErr) throw updErr;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Confirm error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
