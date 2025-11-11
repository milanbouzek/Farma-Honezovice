import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Pouze POST povolen" });
  }

  try {
    const { id } = req.body;

    // načtení předobjednávky
    const { data: preorder, error: err1 } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (err1) throw err1;

    // vložení do objednávek
    const { error: err2 } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        phone: preorder.phone,
        email: preorder.email,
        standard_quantity: preorder.quantity,
        pickup_location: "Předobjednávka",
        status: "nová objednávka",
      },
    ]);

    if (err2) throw err2;

    // označení converted = true
    const { error: err3 } = await supabase
      .from("preorders")
      .update({ converted: true, status: "převedena" })
      .eq("id", id);

    if (err3) throw err3;

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
