import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name, email, phone,
      pickupLocation,
      standardQty, lowcholQty,
      note
    } = req.body;

    if (!name || !pickupLocation) {
      return res.status(400).json({ error: "Chybí povinné údaje." });
    }

    const total = (standardQty || 0) + (lowcholQty || 0);

    if (total < 10 || total % 10 !== 0) {
      return res.status(400).json({
        error: "Minimální objednávka je 10 ks a musí být po násobcích 10."
      });
    }

    const { error } = await supabase.from("preorders").insert([
      {
        name,
        email,
        phone,
        pickupLocation,
        standardQty,
        lowcholQty,
        note,
        status: "čeká",
      },
    ]);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ error: "Failed to create preorder." });
  }
}
