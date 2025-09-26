import { supabaseServer } from "../../lib/supabaseServerClient";
import Twilio from "twilio";

const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

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

    console.log("Sending WhatsApp template with variables:", vars);

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
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return res.status(200).json({ orders: data });
    }

    if (req.method === "POST") {
      const { id, name, email, phone, standardQuantity, lowCholQuantity, pickupLocation, pickupDate } = req.body;
      if (!id) return res.status(400).json({ error: "Chybí ID objednávky" });

      // Načtení objednávky
      const { data: orderData, error: selectError } = await supabaseServer
        .from("orders")
        .select("id, status")
        .eq("id", id)
        .single();

      if (selectError) throw selectError;
      if (!orderData) return res.status(404).json({ error: "Objednávka nenalezena" });

      // Posun statusu o jeden dále
      const currentIndex = STATUSES.indexOf(orderData.status);
      const newIndex = currentIndex < STATUSES.length - 1 ? currentIndex + 1 : currentIndex;
      const newStatus = STATUSES[newIndex];

      const { data: updatedOrder, error: updateError } = await supabaseServer
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id)
        .select("id, status")
        .single();

      if (updateError) throw updateError;

      // WhatsApp notifikace (pokud jsou dostupné údaje)
      if (name && pickupLocation && pickupDate) {
        await sendWhatsAppTemplate({
          name,
          email,
          phone,
          standardQty: standardQuantity,
          lowCholQty: lowCholQuantity,
          pickupLocation,
          pickupDate,
        });
      }

      return res.status(200).json(updatedOrder);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Admin orders API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}