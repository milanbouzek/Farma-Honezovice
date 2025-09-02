import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsApp(to, name, email, standardQty, lowCholQty, pickupLocation, pickupDate, phone) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: `Nová objednávka vajec od ${name} (${email}${phone ? ", tel: " + phone : ""}):
- Standardní: ${standardQty} ks
- Low-cholesterol: ${lowCholQty} ks
- Místo vyzvednutí: ${pickupLocation}
- Datum vyzvednutí: ${pickupDate}`
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

  const {
    name,
    email,
    phone,
    standardQuantity,
    lowCholQuantity,
    pickupLocation,
    pickupDate
  } = req.body;

  if (!name || !email || standardQuantity < 0 || lowCholQuantity < 0 || !pickupLocation || !pickupDate) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    // Načtení aktuálního počtu vajec
    const { data: stockData, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    if (!stockData || stockData.standard_quantity < standardQuantity || stockData.low_chol_quantity < lowCholQuantity) {
      return res.status(400).json({ success: false, error: "Nedostatek vajec." });
    }

    const newStandard = stockData.standard_quantity - standardQuantity;
    const newLowChol = stockData.low_chol_quantity - lowCholQuantity;

    // Uložení objednávky
    const { error: insertError } = await supabaseServer
      .from("orders")
      .insert([{
        customer_name: name,
        email,
        phone,
        standard_quantity: standardQuantity,
        low_chol_quantity: lowCholQuantity,
        pickup_location: pickupLocation,
        pickup_date: pickupDate
      }]);

    if (insertError) throw insertError;

    // Aktualizace zásoby
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({
        standard_quantity: newStandard,
        low_chol_quantity: newLowChol
      })
      .eq("id", 1);

    if (updateError) throw updateError;

    // Odeslání upozornění přes WhatsApp
    await sendWhatsApp(
      "+420720150734",
      name,
      email,
      standardQuantity,
      lowCholQuantity,
      pickupLocation,
      pickupDate,
      phone
    );

    return res.status(200).json({ success: true, remaining: { standard: newStandard, lowChol: newLowChol } });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
