// pages/api/preorders/capacity.js
import { supabaseServer } from "@/lib/supabaseServerClient";

/**
 * Vrací informace potřebné pro výpočet nejdříve dostupného data:
 * - sklad (standard + lowchol)
 * - součet rezervací (předobjednávky, které nejsou potvrzené a nejsou converted)
 * - daily_production (z eggs_settings)
 * - available = stock - reserved
 * - minDate (ISO YYYY-MM-DD) = dnes + potřebné dny (ale minimálně zítra)
 * - daysNeeded
 */

function addDaysToDate(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0,0,0,0);
  return d;
}

export default async function handler(req, res) {
  try {
    // Načteme sklad (předpokládaná tabulka eggs_stock, pouze jedna řádka)
    const { data: stockRows, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("id, standard_quantity, low_chol_quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    const stockStandard = Number(stockRows?.standard_quantity || 0);
    const stockLow = Number(stockRows?.low_chol_quantity || 0);
    const totalStock = stockStandard + stockLow;

    // Načteme součet ne-potvrzených a ne-converted předobjednávek
    const { data: preRows, error: preErr } = await supabaseServer
      .from("preorders")
      .select("standardQty, lowcholQty, status, converted")
      .neq("status", "potvrzená") // pokud chcete defaultně nepočítat potvrzené
      .eq("converted", false);

    if (preErr) throw preErr;

    const reserved = (preRows || []).reduce((s, r) => {
      return s + (Number(r.standardQty || 0) + Number(r.lowcholQty || 0));
    }, 0);

    // Načteme daily_production z eggs_settings (poslední nebo první)
    const { data: settings, error: settingsErr } = await supabaseServer
      .from("eggs_settings")
      .select("daily_production")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsErr) throw settingsErr;

    const dailyProduction = Number(settings?.daily_production ?? 5);

    // dostupné ks (můžeme vytvořit negativní číslo pokud rezervace > sklad)
    const available = totalStock - reserved;

    // vrátíme základní info i vypočtené minDate pro běžnou "10 ks" objednávku
    // ale endpoint bude vracet i raw data, aby frontend mohl počítat pro různé množství

    const today = new Date();
    today.setHours(0,0,0,0);

    res.status(200).json({
      totalStock,
      reserved,
      available,
      dailyProduction,
      today: today.toISOString().split("T")[0]
    });
  } catch (err) {
    console.error("Capacity API error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
