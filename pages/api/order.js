import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

// Twilio klient
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Funkce pro odeslání WhatsApp zprávy
async function sendWhatsAppNotification(name, email, quantity) {
  const message = `Nová objednávka: ${quantity} vajec od ${name} (${email})`;
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, // Twilio sandbox number
    to: `whatsapp:${process.env.MY_WHATSAPP_NUMBER}`,       // Tvé číslo
    body: message,
  });
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

    // 4) Odeslání WhatsApp upozornění
    await sendWhatsAppNotification(name, email, quantity);

    return res.status(200).json({ success: true, remaining: newQuantity });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
