// pages/api/preorders/min-date.js
import { supabaseServer } from "@/lib/supabaseServerClient";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function handler(req, res) {
  try {
    const qty = Number(req.query.qty || 0);

    if (!qty || qty <= 0) {
      return res.status(400).json({ error: "Missing or invalid qty." });
    }

    // === 1) Načtení skladu
    const { data: stockRow, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    const stockStandard = Number(stockRow?.standard_quantity || 0);
    const stockLow = Number(stockRow?.low_chol_quantity || 0);
    const totalStock = stockStandard + stockLow;

    // === 2) Načtení předobjednávek
    const { data: preRows, error: preErr } = await supabaseServer
      .from("preorders")
      .select("standardQty, lowcholQty, status, converted")
      .neq("status", "potvrzená")
      .eq("converted", false);

    if (preErr) throw preErr;

    const reserved = (preRows || []).reduce((sum, r) => {
      return sum + Number(r.standardQty || 0) + Number(r.lowcholQty || 0);
    }, 0);

    const available = totalStock - reserved;

    // === 3) Načtení denní snášky
    const { data: settings, error: settingsErr } = await supabaseServer
      .from("eggs_settings")
      .select("daily_production")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsErr) throw settingsErr;

    const dailyProduction = Number(settings?.daily_production ?? 5);

    // === 4) Výpočet potřebných dnů
    let missing = qty - available;
    let daysNeeded = 0;

    if (missing > 0) {
      daysNeeded = Math.ceil(missing / dailyProduction);
    }

    // === 5) Výpočet minDate (min. zítra)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = addDays(today, 1);
    const minDate = addDays(today, daysNeeded);

    const finalMinDate = minDate < tomorrow ? tomorrow : minDate;

    res.status(200).json({
      qty,
      totalStock,
      reserved,
      available,
      dailyProduction,
      daysNeeded,
      minDate: finalMinDate.toISOString().split("T")[0],
      minDateCZ: finalMinDate.toLocaleDateString("cs-CZ"),
    });
  } catch (err) {
    console.error("min-date API error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
