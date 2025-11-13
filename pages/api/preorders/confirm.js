import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;

    // 1️⃣ Načteme předobjednávku
    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (loadErr) throw loadErr;
    if (!preorder) throw new Error("Preorder not found");

    // 2️⃣ Cena
    const totalPrice = preorder.standardQty * 5 + preorder.lowcholQty * 7;

    // 3️⃣ Vložíme do orders
    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        standard_quantity: preorder.standardQty,
        low_chol_quantity: preorder.lowcholQty,

        // 🔥 TADY BYLA CHYBA
        // preorders.pickuplocation -> orders.pickup_location
        pickup_location: preorder.pickuplocation,

        // Předobjednávky nemají datum — dáme NULL nebo ho budeš chtít doplnit později
        pickup_date: null,

        payment_total: totalPrice,
        payment_currency: "CZK",
        status: "new",
        paid: false,
      },
    ]);

    if (insertErr) throw insertErr;

    // 4️⃣ Předobjednávku označíme jako potvrzenou
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Confirm error:", err);
    return res
      .status(500)
      .json({ error: "Failed to confirm preorder", details: err.message });
  }
}
