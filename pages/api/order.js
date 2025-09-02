import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsApp(to, name, email, standardQty, lowCholQty, pickupLocation, pickupDate) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // sandbox number
      to: `whatsapp:${to}`,
      body: `Nová objednávka vajec od ${name} (${email}):
Standardní vejce: ${standardQty} ks
Vejce s nízkým cholesterolem: ${lowCholQty} ks
Místo vyzvednutí: ${pickupLocation}
Datum vyzvednutí: ${pickupDate}`,
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

  const { name, email, standardQuantity, lowCholQuantity, pickupLocation, pickupDate, phone } = req.body;

  if (!name || !email || !pickupLocation || !pickupDate || (standardQuantity < 0 && lowCholQuantity < 0)) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    // 1) Načtení aktuálního počtu vajec
    const { data: stockData, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    if (!stockData) return res.status(400).json({ success: false, error: "Zásoba není dostupná." });

    if (stockData.standard_quantity < standardQuantity || stockData.low_cholesterol_quantity < lowCholQuantity) {
      return res.status(400).json({ success: false, error: "Nedostatek vajec." });
    }

    const newStandard = stockData.standard_quantity - standardQuantity;
    const newLowChol = stockData.low_cholesterol_quantity - lowCholQuantity;

    // 2) Uložení objednávky
    const { error: insertError } = await supabaseServer
      .from("orders")
      .insert([{
        customer_name: name,
        email,
        standard_quantity: standardQuantity,
        low_cholesterol_quantity: lowCholQuantity,
        pickup_location: pickupLocation,
        pickup_date: pickupDate,
        phone
      }]);

    if (insertError) throw insertError;

    // 3) Aktualizace zásoby
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({ standard_quantity: newStandard, low_cholesterol_quantity: newLowChol })
      .eq("id", stockData.id);

    if (updateError) throw updateError;

    // 4) Odeslání upozornění přes WhatsApp
    await sendWhatsApp(process.env.NOTIFY_WHATSAPP_NUMBER, name, email, standardQuantity, lowCholQuantity, pickupLocation, pickupDate);

    return res.status(200).json({ success: true, remaining: { standard: newStandard, lowChol: newLowChol } });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
