import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsApp(to, name, email, quantity) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // sandbox number
      to: `whatsapp:${to}`, // tvé autorizované číslo
      body: `Nová objednávka vajec od ${name} (${email}): ${quantity} ks.`,
    });
    console.log("WhatsApp message SID:", message.sid);
  } catch (err) {
    console.error("Twilio WhatsApp error:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, quantity } = req.body;

  if (!name || !email || !quantity || quantity < 1) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    // 1) Načtení aktuálního počtu vajec
    const { data: stockData, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    if (!stockData || stockData.quantity < quantity) {
      return res.status(400).json({ success: false, error: "Nedostatek vajec." });
    }

    const newQuantity = stockData.quantity - quantity;

    // 2) Uložení objednávky
    const { error: insertError } = await supabaseServer
      .from("orders")
      .insert([{ name, email, quantity }]);

    if (insertError) throw insertError;

    // 3) Aktualizace zásoby
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({ quantity: newQuantity })
      .eq("id", 1);

    if (updateError) throw updateError;

    // 4) Odeslání upozornění přes WhatsApp
    await sendWhatsApp("+420720150734", name, email, quantity);

    return res.status(200).json({ success: true, remaining: newQuantity });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
