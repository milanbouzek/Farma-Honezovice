import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { preorderId } = req.body;

    if (!preorderId) {
      return res.status(400).json({ error: "Missing preorder ID" });
    }

    // 1️⃣ Načteme předobjednávku
    const { data: preorder, error: fetchErr } = await supabase
      .from("preorders")
      .select("*")
      .eq("id", preorderId)
      .single();

    if (fetchErr || !preorder) {
      return res.status(404).json({ error: "Předobjednávka nenalezena" });
    }

    // 2️⃣ Připravíme data pro tabulku orders – POZOR: mapujeme názvy sloupců
    const orderInsert = {
      customer_name: preorder.name,
      email: preorder.email ?? null,
      phone: preorder.phone ?? null,
      standard_quantity: preorder.standardQty,
      low_chol_quantity: preorder.lowcholQty,
      pickup_location: preorder.pickuplocation,
      pickup_date: null, // předobjednávka nemá datum
      payment_total: null,
      payment_currency: "CZK",
      payment_vs: null,
      payment_url: null,
      payment_qr: null,
      status: "new",
      paid: false,
    };

    // 3️⃣ Zapíšeme objednávku
    const { data: newOrder, error: insertErr } = await supabase
      .from("orders")
      .insert([orderInsert])
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return res.status(500).json({ error: "Nepodařilo se vytvořit objednávku" });
    }

    // 4️⃣ Aktualizujeme předobjednávku na potvrzeno
    const { error: updateErr } = await supabase
      .from("preorders")
      .update({ status: "potvrzena" })
      .eq("id", preorderId);

    if (updateErr) {
      console.error(updateErr);
      return res.status(500).json({ error: "Objednávka vytvořena, ale nepodařilo se aktualizovat stav předobjednávky" });
    }

    return res.status(200).json({
      success: true,
      orderId: newOrder.id,
    });

  } catch (err) {
    console.error("❌ Chyba confirm endpointu:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
