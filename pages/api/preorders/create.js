// pages/api/preorders/create.js
import { supabase } from "@/lib/supabaseClient";
import Twilio from "twilio";

// ===== Twilio WhatsApp nastavení =====
const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MY_WHATSAPP_NUMBER = "+420720150734";
const TWILIO_WHATSAPP_NUMBER = "+16506635799";
const TEMPLATE_ID = "HXcf10544a4ca0baaa4e8470fa5b571275";

// ===== Pomocné funkce =====
function parseCZ(dateStr) {
  if (!dateStr) return null;
  const [dd, mm, yyyy] = dateStr.split(".");
  if (!dd || !mm || !yyyy) return null;
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

// 🔔 ODESLÁNÍ WhatsApp šablony
async function sendWhatsAppPreorderTemplate({
  name,
  email,
  phone,
  standardQty,
  lowcholQty,
  pickupLocation,
  pickupDate,
}) {
  try {
    const vars = {
      "1": String(name || "—"),
      "2": String(email || "—"),
      "3": String(phone || "—"),
      "4": String(standardQty ?? 0),
      "5": String(lowcholQty ?? 0),
      "6": String(pickupLocation || "—"),
      "7": String(pickupDate || "—"),
    };

    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to:   `whatsapp:${MY_WHATSAPP_NUMBER}`,
      contentSid: TEMPLATE_ID,
      contentVariables: JSON.stringify(vars),
    });

    console.log("WhatsApp PREORDER sent:", message.sid);
  } catch (err) {
    console.error("WhatsApp PREORDER ERROR:", err);
  }
}

// ===== API HANDLER =====
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      email = null,
      phone = null,
      pickupLocation,
      pickupDate,
      standardQty = 0,
      lowcholQty = 0,
      note = null,
    } = req.body;

    if (!name || !pickupLocation || !pickupDate) {
      return res.status(400).json({
        error: "Chybí povinné údaje nebo datum vyzvednutí.",
      });
    }

    // ===== DATUM =====
    const d = parseCZ(pickupDate);
    if (!d) return res.status(400).json({ error: "Neplatné datum." });
    d.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const max = new Date(today);
    max.setDate(max.getDate() + 30);

    if (d < tomorrow)
      return res.status(400).json({ error: "Datum musí být nejdříve zítra." });

    if (d > max)
      return res.status(400).json({ error: "Datum je příliš daleko (max. 30 dní)." });

    if (pickupLocation === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) {
      return res.status(400).json({ error: "Pro Dematic nelze vybrat víkend." });
    }

    // ===== VALIDACE MNOŽSTVÍ =====
    const std = Number(standardQty);
    const low = Number(lowcholQty);
    const total = std + low;

    if (total < 10 || total % 10 !== 0)
      return res.status(400).json({
        error: "Minimální objednávka je 10 ks a násobky 10.",
      });

    if (total > 20)
      return res.status(400).json({
        error: "Maximálně 20 ks na jednu předobjednávku.",
      });

    // ===== VÝPOČET AKTUÁLNÍ KAPACITY =====
    const { data: allRows, error: allErr } = await supabase
      .from("preorders")
      .select("standardQty, lowcholQty, status");

    if (allErr) throw allErr;

    const current = (allRows || []).reduce((s, r) => {
      if (r.status !== "potvrzená") {
        return s + (r.standardQty || 0) + (r.lowcholQty || 0);
      }
      return s;
    }, 0);

    if (current + total > 100) {
      return res.status(400).json({
        error: `Celkový limit 100 ks překročen. Dostupných: ${100 - current} ks.`,
      });
    }

    // ===== VÝPOČET CENY =====
    const totalPrice = std * 5 + low * 7;
    const isoDate = d.toISOString().split("T")[0];

    // ===== ULOŽENÍ DO DB =====
    const { data: insertData, error: insertErr } = await supabase
      .from("preorders")
      .insert([
        {
          name,
          email,
          phone,
          pickuplocation: pickupLocation,
          pickupdate: isoDate,
          standardQty: std,
          lowcholQty: low,
          note,
          status: "čeká",
          converted: false,
        },
      ])
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // ===== WHATSAPP NOTIFIKACE =====
    await sendWhatsAppPreorderTemplate({
      name,
      email,
      phone,
      standardQty: std,
      lowcholQty: low,
      pickupLocation,
      pickupDate,
    });

    // ===== RESPONSE =====
    return res.status(200).json({
      success: true,
      id: insertData.id,
      totalPrice,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to create preorder.",
      details: err.message || err,
    });
  }
}
