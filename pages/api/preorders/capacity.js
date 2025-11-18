// pages/api/preorders/capacity.js
import { supabaseServer } from "@/lib/supabaseServerClient";

/**
 * Vrací informace potřebné pro výpočet nejdříve dostupného data:
 * Query param: ?qty=NUMBER  (volitelně)
 *
 * Vrací:
 *  - totalStock
 *  - reserved
 *  - available
 *  - dailyProduction
 *  - today (ISO)
 *  - daysNeeded (integer)
 *  - minDate (ISO YYYY-MM-DD)
 *  - minDateCZ (DD.MM.YYYY)
 */

function formatDateCZ(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function handler(req, res) {
  try {
    const qtyQuery = req.query.qty;
    const wantedQty = qtyQuery ? Math.max(0, Number(qtyQuery)) : 10; // default 10

    // načteme sklad (předpoklad: tabulka eggs_stock obsahuje 1 řádku)
    const { data: stockRows, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("id, standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    const stockStandard = Number(stockRows?.standard_quantity || 0);
    const stockLow = Number(stockRows?.low_chol_quantity || 0);
    const totalStock = stockStandard + stockLow;

    // načteme rezervace (předobjednávky které NEJSOU potvrzené a nejsou converted)
    const { data: preRows, error: preErr } = await supabaseServer
      .from("preorders")
      .select("standardQty, lowcholQty, status, converted")
      .neq("status", "potvrzená")
      .eq("converted", false);

    if (preErr) throw preErr;

    const reserved = (preRows || []).reduce((s, r) => {
      return s + (Number(r.standardQty || 0) + Number(r.lowcholQty || 0));
    }, 0);

    // načteme daily_production z eggs_settings (poslední)
    const { data: settings, error: settingsErr } = await supabaseServer
      .from("eggs_settings")
      .select("daily_production")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsErr) throw settingsErr;

    const dailyProduction = Number(settings?.daily_production ?? 5);

    // dostupné ks (může být i negativní)
    const available = totalStock - reserved;

    // logika pro minDate:
    // pokud available >= wantedQty => minDate = tomorrow
    // jinak: need = wantedQty - available; daysNeeded = ceil( need / dailyProduction )
    // minDate = today + daysNeeded (alespoň +1 = zítra)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = addDays(today, 1);

    let daysNeeded = 0;
    let minDate = tomorrow;

    if (available >= wantedQty) {
      daysNeeded = 0;
      minDate = tomorrow;
    } else {
      const need = wantedQty - available;
      // pokud dailyProduction je 0 (nebo chybné), nastavíme velké číslo nebo error
      const perDay = dailyProduction > 0 ? dailyProduction : 1;
      daysNeeded = Math.ceil(need / perDay);
      // minDate is today + daysNeeded (ale minimum tomorrow)
      const candidate = addDays(today, daysNeeded);
      if (candidate < tomorrow) minDate = tomorrow;
      else minDate = candidate;
    }

    // výstup
    return res.status(200).json({
      totalStock,
      reserved,
      available,
      dailyProduction,
      today: today.toISOString().split("T")[0],
      wantedQty,
      daysNeeded,
      minDate: minDate.toISOString().split("T")[0],
      minDateCZ: formatDateCZ(minDate),
    });
  } catch (err) {
    console.error("Capacity API error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
