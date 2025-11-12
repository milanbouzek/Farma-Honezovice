import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Pouze POST povolen" });
  }

  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Chybí ID předobjednávky" });
    }

    // 1️⃣ Načteme předobjednávku
    const { data: preorder, error: err1 } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", id)
      .single();

    if (err1 || !preorder) {
      throw new Error("Nepodařilo se načíst předobjednávku");
    }

    // 2️⃣ Vložíme novou objednávku
    const { error: err2 } = await supabase.from("orders").insert([
      {
        customer_name: preorder.name,
        phone: preorder.phone,
        email: preorder.email,
        standard_quantity: preorder.standard_quantity || 0,
        low_chol_quantity: preorder.low_chol_quantity || 0,
        pickup_location: preorder.pickup_location || "Neurčeno",
        pickup_date: new Date().toISOString().split("T")[0], // dnešní datum jako default
        status: "nová objednávka",
        paid: false,
        payment_total: null,
        payment_currency: "CZK",
      },
    ]);

    if (err2) throw err2;

    // 3️⃣ Aktualizujeme předobjednávku – označíme jako převedenou
    const { error: err3 } = await supabase
      .from("preorders")
      .update({ converted: true, status: "převedena" })
      .eq("id", id);

    if (err3) throw err3;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Chyba při převodu předobjednávky:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
