import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MY_WHATSAPP_NUMBER = "+420720150734"; // kam přijde notifikace
const TWILIO_WHATSAPP_NUMBER = "+16506635799";

// ID schválené šablony (Twilio Content Template SID)
const TEMPLATE_ID = "HX15e26d02bbfa66cba5a7310f7d12cbff";

async function sendWhatsAppTemplate({ standardQty, lowCholQty }) {
  try {
    const vars = {
      "1": String(standardQty || 0),
      "2": String(lowCholQty || 0)
    };

    console.log("Sending WhatsApp template with variables:", vars);

    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${MY_WHATSAPP_NUMBER}`, // můžeš změnit na zákazníka: `phone`
      contentSid: TEMPLATE_ID,
      contentVariables: JSON.stringify(vars)
    });

    console.log("WhatsApp template sent SID:", message.sid);
  } catch (err) {
    console.error("Twilio WhatsApp template error:", err);
    throw err;
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

  if (
    !name ||
    standardQuantity < 0 ||
    lowCholQuantity < 0 ||
    !pickupLocation ||
    !pickupDate
  ) {
    return res
      .status(400)
      .json({ success: false, error: "Neplatná data." });
  }

  try {
    // načtení skladu
    const { data: stockData, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    if (
      !stockData ||
      stockData.standard_quantity < standardQuantity ||
      stockData.low_chol_quantity < lowCholQuantity
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Nedostatek vajec." });
    }

    const newStandard = stockData.standard_quantity - standardQuantity;
    const newLowChol = stockData.low_chol_quantity - lowCholQuantity;

    const totalPrice = standardQuantity * 5 + lowCholQuantity * 7;

    // uložení objednávky
    const { data: newOrder, error: insertError } = await supabaseServer
      .from("orders")
      .insert([
        {
          customer_name: name,
          email: email || null,
          phone,
          standard_quantity: standardQuantity,
          low_chol_quantity: lowCholQuantity,
          pickup_location: pickupLocation,
          pickup_date: pickupDate
        }
      ])
      .select("id")
      .single();

    if (insertError) throw insertError;

    // update skladu
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({
        standard_quantity: newStandard,
        low_chol_quantity: newLowChol
      })
      .eq("id", 1);

    if (updateError) throw updateError;

    // WhatsApp notifikace pomocí schválené šablony
    await sendWhatsAppTemplate({
      standardQty: standardQuantity,
      lowCholQty: lowCholQuantity
    });

    return res.status(200).json({
      success: true,
      orderId: newOrder.id,
      totalPrice,
      remaining: {
        standard: newStandard,
        lowChol: newLowChol
      }
    });
  } catch (err) {
    console.error("Order API error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
}
