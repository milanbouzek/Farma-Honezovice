import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;

    // 1️⃣ Načíst předobjednávku
    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (loadErr || !preorder) throw loadErr || new Error("Preorder not found");

    // 2️⃣ Vypočítat cenu (stejně jako objednávka)
    const totalPrice =
      preorder.standardQty * 5 + preorder.lowcholQty * 7;

    // 3️⃣ Zapsat do orders tabulky
    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        standard_quantity: preorder.standardQty,
        low_chol_quantity: preorder.lowcholQty,
        pickup_location: preorder.pickupLocation,
        pickup_date: null, // předobjednávka nemá datum — doplníš podle potřeby
        payment_total: totalPrice,
        payment_currency: "CZK",
        status: "new",
        paid: false,
      },
    ]);

    if (insertErr) throw insertErr;

    // 4️⃣ Aktualizovat status v preorders
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzená" })
      .eq("id", id);

    if (updateErr) throw updateErr;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ error: "Failed to confirm preorder." });
  }
}
