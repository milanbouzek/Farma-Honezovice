import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Chybí ID předobjednávky" });
    }

    // 1️⃣ Najdi původní předobjednávku
    const { data: preorder, error: fetchError } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !preorder) {
      return res.status(404).json({ error: "Předobjednávka nenalezena" });
    }

    // 2️⃣ Aktualizuj její status na potvrzeno
    const { error: updateError } = await supabase
      .from("preorders")
      .update({ status: "potvrzeno" })
      .eq("id", id);

    if (updateError) throw updateError;

    // 3️⃣ Vlož ji do tabulky orders jako novou objednávku
    const { error: insertError } = await supabase.from("orders").insert([
      {
        name: preorder.name,
        email: preorder.email,
        phone: preorder.phone,
        pickupLocation: preorder.pickuplocation, // pozor: lowercase v preorders
        standardQuantity: preorder.standardQty,
        lowCholQuantity: preorder.lowcholQty,
        note: preorder.note || null,
        status: "nová",
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) throw insertError;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při potvrzení předobjednávky:", err);
    return res.status(500).json({ error: "Chyba při potvrzení předobjednávky" });
  }
}
