import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;

    const { data: preorder, error: loadErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (loadErr) throw loadErr;
    if (!preorder) throw new Error("Preorder not found");

    const totalPrice = preorder.standardQty * 5 + preorder.lowcholQty * 7;

    const { error: insertErr } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        standard_quantity: preorder.standardQty,
        low_chol_quantity: preorder.lowcholQty,
        pickup_location: preorder.pickuplocation,

        // ⭐ OPRAVA – pickup_date nesmí být NULL:
        pickup_date: new Date().toISOString().slice(0, 10),

        payment_total: totalPrice,
        payment_currency: "CZK",
        status: "new",
        paid: false,
      },
    ]);

    if (insertErr) throw insertErr;

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
