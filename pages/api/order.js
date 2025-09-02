import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsApp(to, data) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: `Nová objednávka vajec od ${data.name} (${data.email}, ${data.phone || "bez telefonu"}):
- Standardní vejce: ${data.standardQuantity} ks
- Nízký cholesterol: ${data.lowCholQuantity} ks
📍 Místo vyzvednutí: ${data.pickupLocation}
📅 Datum vyzvednutí: ${data.pickupDate}`,
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
    pickupDate,
  } = req.body;

  if (
    !name ||
    !email ||
    !pickupLocation ||
    !pickupDate ||
    (standardQuantity < 1 && lowCholQuantity < 1)
  ) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    // 1) Načtení aktuálního stavu zásob
    const { data: stockData, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_cholesterol_quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    if (
      !stockData ||
      stockData.standard_quantity < standardQuantity ||
      stockData.low_cholesterol_quantity < lowCholQuantity
    ) {
      return res.status(400).json({ success: false, error: "Nedostatek vajec." });
    }

    const newStandard = stockData.standard_quantity - standardQuantity;
    const newLowChol = stockData.low_cholesterol_quantity - lowCholQuantity;

    // 2) Uložení objednávky
    const { error: insertError } = await supabaseServer.from("orders").insert([
      {
        customer_name: name,
        email,
        phone,
        standard_quantity: standardQuantity,
        low_cholesterol_quantity: lowCholQuantity,
        pickup_location: pickupLocation,
        pickup_date: pickupDate,
      },
    ]);

    if (insertError) throw insertError;

    // 3) Aktualizace zásob
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({
        standard_quantity: newStandard,
        low_cholesterol_quantity: newLowChol,
      })
      .eq("id", 1);

    if (updateError) throw updateError;

    // 4) Odeslání upozornění přes WhatsApp
    await sendWhatsApp("+420720150734", {
      name,
      email,
      phone,
      standardQuantity,
      lowCholQuantity,
      pickupLocation,
      pickupDate,
    });

    return res.status(200).json({
      success: true,
      remaining: {
        standard: newStandard,
        lowCholesterol: newLowChol,
      },
    });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
