import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsApp(to, name, email, standardQty, lowCholQty) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: `Nová objednávka: ${name} (${email})\nStandard: ${standardQty} ks\nLowChol: ${lowCholQty} ks`,
    });
    console.log("WhatsApp SID:", message.sid);
  } catch (err) {
    console.error("Twilio WhatsApp error:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, phone, standardQuantity, lowCholQuantity, pickupLocation, pickupDate } = req.body;

  if (!name || !email || !pickupLocation || !pickupDate || (standardQuantity + lowCholQuantity < 1)) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    const { data: stock, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("*")
      .single();

    if (stockError) throw stockError;

    if (stock.standard_quantity < standardQuantity || stock.low_chol_quantity < lowCholQuantity) {
      return res.status(400).json({ success: false, error: "Nedostatek vajec." });
    }

    const newStandard = stock.standard_quantity - standardQuantity;
    const newLowChol = stock.low_chol_quantity - lowCholQuantity;

    // Vložení objednávky
    const { error: insertError } = await supabaseServer.from("orders").insert([{
      customer_name: name,
      email,
      phone,
      standard_quantity: standardQuantity,
      low_chol_quantity: lowCholQuantity,
      pickup_location: pickupLocation,
      pickup_date: pickupDate,
    }]);
    if (insertError) throw insertError;

    // Aktualizace stavu vajec
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({ standard_quantity: newStandard, low_chol_quantity: newLowChol })
      .eq("id", stock.id);
    if (updateError) throw updateError;

    // WhatsApp notifikace
    await sendWhatsApp("+420720150734", name, email, standardQuantity, lowCholQuantity);

    res.status(200).json({ success: true, remaining: { standard: newStandard, lowChol: newLowChol } });
  } catch (err) {
    console.error("Order API error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
