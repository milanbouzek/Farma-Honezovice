import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsApp(to, name, email, quantity, pickupLocation, pickupDate, phone) {
  try {
    let body = `Nová objednávka vajec od ${name} (${email}): ${quantity} ks. Místo vyzvednutí: ${pickupLocation}. Datum: ${pickupDate}.`;
    if (phone) body += ` Telefon: ${phone}.`;

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body,
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

  const { name, email, quantity, pickup_location, pickup_date, phone } = req.body;

  if (!name || !email || !quantity || quantity < 1 || !pickup_location || !pickup_date) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
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

    const { error: insertError } = await supabaseServer
      .from("orders")
      .insert([{ 
        customer_name: name,
        email,
        quantity,
        pickup_location,
        pickup_date,
        phone
      }]);
    if (insertError) throw insertError;

    await sendWhatsApp("+420720150734", name, email, quantity, pickup_location, pickup_date, phone);

    return res.status(200).json({ success: true, remaining: newQuantity });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
