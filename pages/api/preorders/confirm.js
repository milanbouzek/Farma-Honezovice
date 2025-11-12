import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Pouze POST povolen" });
  }

  try {
    const { id } = req.body;

    // 🔹 načtení detailu předobjednávky
    const { data: preorder, error: fetchError } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!preorder) throw new Error("Předobjednávka nenalezena");

    // 🔹 vložení nové objednávky
    const { error: insertError } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        phone: preorder.phone,
        email: preorder.email,
        standard_quantity: preorder.standardQty || 0,
        lowchol_quantity: preorder.lowcholQty || 0,
        pickup_location: preorder.pickupLocation || "neuvedeno",
        source: "předobjednávka", // nový doplňkový sloupec, volitelné
        status: "nová objednávka",
      },
    ]);

    if (insertError) throw insertError;

    // 🔹 označení předobjednávky jako převedené
    const { error: updateError } = await supabase
      .from("preorders")
      .update({ converted: true, status: "převedena" })
      .eq("id", id);

    if (updateError) throw updateError;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při potvrzení předobjednávky:", err);
    res.status(500).json({ error: err.message });
  }
}
