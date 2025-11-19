// pages/api/admin/update-production.js
import { supabaseServer } from "@/lib/supabaseServerClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Pouze POST metoda je povolena." });
  }

  try {
    const { dailyProduction } = req.body;
    const value = Number(dailyProduction);

    if (Number.isNaN(value) || value < 0) {
      return res.status(400).json({ error: "Neplatná hodnota." });
    }

    // uložíme do posledního řádku v eggs_settings (nebo vytvoříme nový)
    const { data: existing, error: selectErr } = await supabaseServer
      .from("eggs_settings")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectErr) throw selectErr;

    if (existing?.id) {
      // update
      const { error: updateErr } = await supabaseServer
        .from("eggs_settings")
        .update({ daily_production: value })
        .eq("id", existing.id);

      if (updateErr) throw updateErr;
    } else {
      // insert pokud tabulka byla prázdná
      const { error: insertErr } = await supabaseServer
        .from("eggs_settings")
        .insert([{ daily_production: value }]);

      if (insertErr) throw insertErr;
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Update production error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
