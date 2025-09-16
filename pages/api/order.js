import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// tvoje soukromé číslo
const MY_WHATSAPP_NUMBER = "+420720150734";
// Twilio WhatsApp číslo
const TWILIO_WHATSAPP_NUMBER = "+16506635799";

async function sendWhatsApp(
  name,
  email,
  standardQty,
  lowCholQty,
  pickupLocation,
  pickupDate,
  phone,
  orderId,
  totalPrice
) {
  try {
    const contactParts = [];
    if (email) contactParts.push(email);
    if (phone) contactParts.push(`tel: ${phone}`);
    const contactInfo = contactParts.length
      ? ` (${contactParts.join(", ")})`
      : "";

    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${MY_WHATSAPP_NUMBER}`,
      body: `Nová objednávka #${orderId} od ${name}${contactInfo}:
- Standardní: ${standardQty} ks
- Low-cholesterol: ${lowCholQty} ks
- Místo vyzvednutí: ${pickupLocation}
- Datum vyzvednutí: ${pickupDate}
- Celková cena: ${totalPrice} Kč`
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

    // celková cena
    const totalPrice = standardQuantity * 5 + lowCholQuantity * 7;

    // uložení objednávky + získání id
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
      .select("id") // ⬅️ aby se vrátilo ID
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

    // WhatsApp notifikace
    await sendWhatsApp(
      name,
      email,
      standardQuantity,
      lowCholQuantity,
      pickupLocation,
      pickupDate,
      phone,
      newOrder.id,
      totalPrice
    );

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
