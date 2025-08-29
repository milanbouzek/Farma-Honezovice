import { supabaseServer } from "../../lib/supabaseServerClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, quantity } = req.body;

  if (!name || !email || !quantity || quantity < 1) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    // 1) Zjistit aktuální počet vajec
    const { data: stockData, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("quantity")
      .single();

    if (stockError) throw stockError;

    if (!stockData || stockData.quantity < quantity) {
      return res.status(400).json({ success: false, error: "Nedostatek vajec." });
    }

    const newQuantity = stockData.quantity - quantity;

    // 2) Zapsat objednávku
    const { error: insertError } = await supabaseServer
      .from("orders")
      .insert([{ name, email, quantity }]);

    if (insertError) throw insertError;

    // 3) Aktualizovat zásobu
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({ quantity: newQuantity })
      .eq("id", 1); // musíš mít id=1 u zásoby

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, remaining: newQuantity });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
