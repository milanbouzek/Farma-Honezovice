import { supabase } from "@/lib/supabaseClient";

function isValidDateString(d) {
  if (!d) return false;
  const dt = new Date(d);
  return !Number.isNaN(dt.getTime());
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

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

    // povinné
    if (!name || !pickupLocation) {
      return res.status(400).json({ error: "Chybí povinné údaje." });
    }

    // datum povinné (požadavek dle tvého posledního zadání)
    if (!pickupDate || !isValidDateString(pickupDate)) {
      return res.status(400).json({ error: "Neplatné nebo chybějící datum vyzvednutí." });
    }

    const pickup = new Date(pickupDate);
    pickup.setHours(0,0,0,0);

    // zítra
    const tomorrow = new Date();
    tomorrow.setHours(0,0,0,0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // max +30 dní
    const maxDate = new Date();
    maxDate.setHours(0,0,0,0);
    maxDate.setDate(maxDate.getDate() + 30);

    if (pickup < tomorrow) {
      return res.status(400).json({ error: "Datum musí být nejdříve zítra." });
    }
    if (pickup > maxDate) {
      return res.status(400).json({ error: "Datum je příliš daleko (max. +30 dní)." });
    }
    // pro Dematic zakážeme víkendy
    if (pickupLocation === "Dematic Ostrov u Stříbra 65" && isWeekend(pickup)) {
      return res.status(400).json({ error: "Pro Dematic nelze vybrat víkend." });
    }

    const standard = parseInt(standardQty || 0, 10);
    const lowchol = parseInt(lowcholQty || 0, 10);
    const total = standard + lowchol;

    // logika množství: min 10 a násobky 10, max 20
    if (total < 10 || total % 10 !== 0) {
      return res.status(400).json({
        error: "Minimální objednávka je 10 ks a musí být po násobcích 10.",
      });
    }
    if (total > 20) {
      return res.status(400).json({ error: "Maximálně 20 ks na jednu předobjednávku." });
    }

    // zkontroluj celkový limit (součet všech předobjednávek)
    const { data: totalData, error: totalErr } = await supabase
      .from("preorders")
      .select("standardQty, lowcholQty");

    if (totalErr) throw totalErr;

    const totalCurrent = (totalData || []).reduce(
      (s, r) => s + (r.standardQty || 0) + (r.lowcholQty || 0),
      0
    );

    const MAX_TOTAL = 100;
    if (totalCurrent + total > MAX_TOTAL) {
      return res.status(400).json({
        error: `Celkový limit ${MAX_TOTAL} ks překročen. Aktuálně dostupných ${MAX_TOTAL - totalCurrent} ks.`,
      });
    }

    // vlož do preorders
    const { error: insertErr } = await supabase.from("preorders").insert([
      {
        name,
        email,
        phone,
        pickuplocation: pickupLocation, // db Sloupec pravděpodobně lowercased
        pickupdate: pickup.toISOString().split("T")[0], // ukládáme jako YYYY-MM-DD (text/date podle DB)
        standardQty: standard,
        lowcholQty: lowchol,
        note,
        status: "čeká", // výchozí stav
      },
    ]);

    if (insertErr) throw insertErr;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Create error:", err);
    return res.status(500).json({ error: "Failed to create preorder.", details: err.message || err });
  }
}
