import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";
import QRCode from "qrcode";

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// tvoje soukromé číslo
const MY_WHATSAPP_NUMBER = "+420720150734";
// Twilio WhatsApp číslo
const TWILIO_WHATSAPP_NUMBER = "+16506635799";

// nastavení cen
const PRICE_STANDARD = 5;   // Kč za 1 standardní vejce
const PRICE_LOWCHOL = 6;    // Kč za 1 vejce se sníženým cholesterolem
const BANK_ACCOUNT = "123456789/0100"; // nahraď svým číslem účtu
const BANK_IBAN = "CZ650100000000123456789"; // nahraď svým IBANem

async function sendWhatsApp(name, email, standardQty, lowCholQty, pickupLocation, pickupDate, phone, totalPrice, qrUrl) {
  try {
    const contactParts = [];
    if (email) contactParts.push(email);
    if (phone) contactParts.push(`tel: ${phone}`);
    const contactInfo = contactParts.length ? ` (${contactParts.join(", ")})` : "";

    const messageBody = 
`Nová objednávka vajec od ${name}${contactInfo}:
- Standardní: ${standardQty} ks
- Low-cholesterol: ${lowCholQty} ks
- Místo vyzvednutí: ${pickupLocation}
- Datum vyzvednutí: ${pickupDate}
--------------------------------
Celková cena: ${totalPrice} Kč
Platba: QR kód ${qrUrl}`;

    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${MY_WHATSAPP_NUMBER}`,
      body: messageBody
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

  if (!name || standardQuantity < 0 || lowCholQuantity < 0 || !pickupLocation || !pickupDate) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
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

    // výpočet ceny
    const totalPrice = (standardQuantity * PRICE_STANDARD) + (lowCholQuantity * PRICE_LOWCHOL);

    // QR Platba (ČNB standard)
    const qrString = `SPD*1.0*ACC:${BANK_IBAN}*AM:${totalPrice}*CC:CZK*MSG:Objednavka vajec`;
    const qrUrl = await QRCode.toDataURL(qrString);

    // uložení objednávky včetně ceny
    const { error: insertError } = await supabaseServer
      .from("orders")
      .insert([{
        customer_name: name,
        email: email || null,
        phone,
        standard_quantity: standardQuantity,
        low_chol_quantity: lowCholQuantity,
        pickup_location: pickupLocation,
        pickup_date: pickupDate,
        total_price: totalPrice
      }]);

    if (insertError) throw insertError;

    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({
        standard_quantity: newStandard,
        low_chol_quantity: newLowChol
      })
      .eq("id", 1);

    if (updateError) throw updateError;

    // odeslání zprávy na tvé soukromé číslo
    await sendWhatsApp(
      name,
      email,
      standardQuantity,
      lowCholQuantity,
      pickupLocation,
      pickupDate,
      phone,
      totalPrice,
      qrUrl
    );

    return res.status(200).json({ 
      success: true, 
      remaining: { standard: newStandard, lowChol: newLowChol },
      totalPrice,
      qrUrl
    });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
