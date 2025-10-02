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
  pickupDate,
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
      const {
        name,
        email,
        phone,
        standardQuantity,
        lowCholQuantity,
        pickupLocation,
        pickupDate,
      } = req.body;

      if (!name || !pickupLocation || !pickupDate) {
        return res
          .status(400)
          .json({ success: false, error: "Neplatná data." });
      }

      const standardQty = Number(standardQuantity);
      const lowCholQty = Number(lowCholQuantity);

      // 🥚 Načtení skladu
      const { data: stockData, error: stockError } = await supabaseServer
        .from("eggs_stock")
        .select("id, standard_quantity, low_chol_quantity")
        .limit(1)
        .maybeSingle();

      if (stockError) throw stockError;
      if (!stockData)
        return res
          .status(400)
          .json({ success: false, error: "Sklad nenalezen." });

      if (
        stockData.standard_quantity < standardQty ||
        stockData.low_chol_quantity < lowCholQty
      ) {
        return res
          .status(400)
          .json({ success: false, error: "Nedostatek vajec ve skladu." });
      }

      // 💰 Načtení aktuálních cen
      const { data: priceData, error: priceError } = await supabaseServer
        .from("eggs_prices")
        .select("standard_price, low_chol_price")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priceError) throw priceError;
      if (!priceData)
        return res
          .status(400)
          .json({ success: false, error: "Ceník nenalezen." });

      const { standard_price, low_chol_price } = priceData;
      const totalPrice = standardQty * standard_price + lowCholQty * low_chol_price;

      const newStandard = stockData.standard_quantity - standardQty;
      const newLowChol = stockData.low_chol_quantity - lowCholQty;

      // 📝 Uložení objednávky
      const { data: newOrder, error: insertError } = await supabaseServer
        .from("orders")
        .insert([
          {
            customer_name: name,
            email: email || null,
            phone,
            standard_quantity: standardQty,
            low_chol_quantity: lowCholQty,
            pickup_location: pickupLocation,
            pickup_date: parseCZDate(pickupDate),
            status: STATUSES[0], // nová objednávka
            payment_total: totalPrice, // ✅ uložíme cenu
          },
        ])
        .select("id, status, payment_total")
        .single();

      if (insertError) throw insertError;

      // 📦 Update skladu
      const { error: updateError } = await supabaseServer
        .from("eggs_stock")
        .update({
          standard_quantity: newStandard,
          low_chol_quantity: newLowChol,
        })
        .eq("id", stockData.id);

      if (updateError) throw updateError;

      // 📲 WhatsApp notifikace
      await sendWhatsAppTemplate({
        name,
        email,
        phone,
        standardQty,
        lowCholQty,
        pickupLocation,
        pickupDate,
      });

      return res.status(200).json({
        success: true,
        orderId: newOrder.id,
        totalPrice: newOrder.payment_total,
        remaining: { standard: newStandard, lowChol: newLowChol },
        message: `Objednávka byla úspěšně odeslána.`,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
