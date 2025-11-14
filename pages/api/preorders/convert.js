import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Pouze POST povolen" });
  }

  const { preorderId } = req.body;

  if (!preorderId) {
    return res.status(400).json({ error: "Chybí ID předobjednávky." });
  }

  try {
    // 🔶 získat předobjednávku
    const { data: pre, error: preErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", preorderId)
      .single();

    if (preErr) throw preErr;

    // 🔶 vytvořit objednávku
    const { error: insErr } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: pre.name,
          email: pre.email,
          phone: pre.phone,
          pickup_location: pre.pickuplocation,
          pickup_date: pre.pickupdate,
          standard_quantity: pre.standardQty,
          low_chol_quantity: pre.lowcholQty,
          note: pre.note,
          status: "nová objednávka",
          paid: false,
          payment_total: (pre.standardQty * 5) + (pre.lowcholQty * 7),
        },
      ]);

    if (insErr) throw insErr;

    // 🔶 označit předobjednávku jako převedenou
    const { error: updErr } = await supabase
      .from("preorders")
      .update({ converted: true })
      .eq("id", preorderId);

    if (updErr) throw updErr;

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
