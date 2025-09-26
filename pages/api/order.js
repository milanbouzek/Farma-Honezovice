import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MY_WHATSAPP_NUMBER = "+420720150734";
const TWILIO_WHATSAPP_NUMBER = "+16506635799";
const TEMPLATE_ID = "HXcf10544a4ca0baaa4e8470fa5b571275";

// Pomocná funkce na převod "dd.mm.yyyy" → ISO "yyyy-mm-dd"
function parseCZDate(czDate) {
  const [dd, mm, yyyy] = czDate.split(".");
  return `${yyyy}-${mm}-${dd}`;
}

async function sendWhatsAppTemplate({
  name,
  email,
  phone,
  standardQty,
  lowCholQty,
  pickupLocation,
  pickupDate
}) {
  try {
    const vars = {
      "1": String(name || "—"),
      "2": String(email || "—"),
      "3": String(phone || "—"),
      "4": String(standardQty ?? 0),
      "5": String(lowCholQty ?? 0),
      "6": String(pickupLocation || "—"),
      "7": String(pickupDate || "—"),
    };

    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${MY_WHATSAPP_NUMBER}`,
      contentSid: TEMPLATE_ID,
      contentVariables: JSON.stringify(vars),
    });

    console.log("WhatsApp template sent SID:", message.sid);
  } catch (err) {
    console.error("Twilio WhatsApp template error:", err);
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, phone, standardQuantity, lowCholQuantity, pickupLocation, pickupDate } = req.body;

  if (!name || !pickupLocation || !pickupDate || standardQuantity < 0 || lowCholQuantity < 0) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    const dbDate = parseCZDate(pickupDate);

    // Uložení nové objednávky
    const { data: newOrder, error } = await supabaseServer
      .from("orders")
      .insert([{
        customer_name: name,
        email: email || null,
        phone,
        standard_quantity: standardQuantity,
        low_chol_quantity: lowCholQuantity,
        pickup_location: pickupLocation,
        pickup_date: dbDate,
        status: "nová objednávka",
      }])
      .select("id")
      .single();

    if (error) throw error;

    // Odeslání WhatsApp notifikace
    await sendWhatsAppTemplate({
      name,
      email,
      phone,
      standardQty: standardQuantity,
      lowCholQty: lowCholQuantity,
      pickupLocation,
      pickupDate,
    });

    return res.status(200).json({ success: true, orderId: newOrder.id });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
