// pages/api/preorders/confirm.js
import supabase from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.body;

  // ✅ Najdeme předobjednávku
  const { data: preorder, error: findErr } = await supabase
    .from("preorders")
    .select("*")
    .eq("id", id)
    .single();

  if (findErr || !preorder) {
    return res.status(404).json({ error: "Předobjednávka nenalezena." });
  }

  // ✅ Vytvoříme klasickou objednávku
  const { error: createErr } = await supabase.from("orders").insert([
    {
      customer_name: preorder.customer_name,
      email: preorder.email,
      phone: preorder.phone,
      standard_quantity: preorder.standard_quantity,
      low_chol_quantity: preorder.low_chol_quantity,
      pickup_location: preorder.pickup_location,
      pickup_date: preorder.pickup_date,
      status: "nová objednávka",
      paid: false,
      payment_total: 0,
      payment_currency: "CZK",
    },
  ]);

  if (createErr) {
    return res.status(500).json({ error: "Chyba při vytváření objednávky." });
  }

  // ✅ Aktualizujeme stav předobjednávky
  const { error: updateErr } = await supabase
    .from("preorders")
    .update({ status: "vyřízeno" })
    .eq("id", id);

  if (updateErr) {
    return res.status(500).json({ error: "Chyba při aktualizaci předobjednávky." });
  }

  return res.status(200).json({ success: true });
}
