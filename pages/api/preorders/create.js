// pages/api/preorders/create.js
import { supabaseServer } from "@/lib/supabaseServerClient";
import Twilio from "twilio";

// ===== Twilio WhatsApp =====
const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MY_WHATSAPP_NUMBER = "+420720150734";
const TWILIO_WHATSAPP_NUMBER = "+16506635799";
const TEMPLATE_ID = "HXcf10544a4ca0baaa4e8470fa5b571275";

// ===== Pomocné funkce =====
function parseCZ(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split(".");
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ===== WHATSAPP TEMPLATE =====
async function sendWhatsAppPreorderTemplate(vars) {
  try {
    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to:   `whatsapp:${MY_WHATSAPP_NUMBER}`,
      contentSid: TEMPLATE_ID,
      contentVariables: JSON.stringify({
        "1": String(vars.name || "—"),
        "2": String(vars.email || "—"),
        "3": String(vars.phone || "—"),
        "4": String(vars.standardQty ?? 0),
        "5": String(vars.lowcholQty ?? 0),
        "6": String(vars.pickupLocation || "—"),
        "7": String(vars.pickupDate || "—"),
      }),
    });

    console.log("WhatsApp PREORDER sent:", message.sid);
  } catch (err) {
    console.error("WhatsApp PREORDER ERROR:", err);
  }
}

// ===== API HANDLER =====
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

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

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const max = addDays(today, 30);

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

    // -----------------------------------------------------------
    // ==========  🔥 NOVÝ KÓD → dynamická dostupnost  🔥 ==========
    // -----------------------------------------------------------

    // ⭐ 1) Načtení skladu
    const { data: stock, error: stockErr } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (stockErr) throw stockErr;

    const currentStock =
      Number(stock.standard_quantity || 0) +
      Number(stock.low_chol_quantity || 0);

    // ⭐ 2) Načtení rezervací (čeká, zrušená – NE potvrzená, NE converted)
    const { data: preRows, error: preErr } = await supabaseServer
      .from("preorders")
      .select("standardQty, lowcholQty, status, converted");

    if (preErr) throw preErr;

    const reserved = (preRows || []).reduce((sum, r) => {
      if (r.status === "potvrzená" || r.converted === true) return sum;
      return sum + (Number(r.standardQty) + Number(r.lowcholQty));
    }, 0);

    // ⭐ 3) daily production
    const { data: settings, error: settingsErr } = await supabaseServer
      .from("eggs_settings")
      .select("daily_production")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsErr) throw settingsErr;

    const daily = Number(settings?.daily_production ?? 5);

    // ⭐ 4) Kolik máme reálně k dispozici
    const available = currentStock - reserved; // může být záporné

    // ⭐ 5) Kolik vajec chybí
    const needed = Math.max(0, total - available);

    // ⭐ 6) Kolik dnů je potřeba
    const daysNeeded =
      daily > 0 ? Math.ceil(needed / daily) : 9999;

    // ⭐ 7) Minimálně zítra
    const minOffset = Math.max(1, daysNeeded);
    const minDate = addDays(today, minOffset);

    // ⭐ 8) Pokud uživatel vybral dřívější datum → odmítnout
    if (d < minDate) {
      return res.status(400).json({
        error: `Nejdřívější dostupný termín pro tuto předobjednávku je ${minDate.toLocaleDateString("cs-CZ")}.`,
        minDate: minDate.toISOString().split("T")[0],
        needed,
        daysNeeded,
      });
    }

    // -----------------------------------------------------------
    // ===== LIMIT 100 KS (původní logika) =====
    const { data: allRows, error: allErr } = await supabaseServer
      .from("preorders")
      .select("standardQty, lowcholQty, status, converted");

    if (allErr) throw allErr;

    const currentTotalReserved = (allRows || []).reduce((s, r) => {
      if (r.status === "potvrzená" || r.converted === true) return s;
      return s + (Number(r.standardQty) + Number(r.lowcholQty));
    }, 0);

    if (currentTotalReserved + total > 100) {
      return res.status(400).json({
        error: `Celkový limit 100 ks překročen. Dostupných: ${100 - currentTotalReserved} ks.`,
      });
    }

    // ===== CENA =====
    const totalPrice = std * 5 + low * 7;
    const isoDate = d.toISOString().split("T")[0];

    // ===== ULOŽENÍ =====
    const { data: insertData, error: insertErr } = await supabaseServer
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

    // ===== WHATSAPP =====
    await sendWhatsAppPreorderTemplate({
      name,
      email,
      phone,
      standardQty: std,
      lowcholQty: low,
      pickupLocation,
      pickupDate,
    });

    return res.status(200).json({
      success: true,
      id: insertData.id,
      totalPrice,
    });

  } catch (err) {
    console.error("CREATE PREORDER ERROR:", err);
    return res.status(500).json({
      error: "Failed to create preorder.",
      details: err.message || err,
    });
  }
}
