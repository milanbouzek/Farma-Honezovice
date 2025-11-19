// pages/api/admin/eggs-settings.js
import { supabaseServer } from "@/lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    // ===== GET (return latest value) =====
    if (req.method === "GET") {
      const { data, error } = await supabaseServer
        .from("eggs_settings")
        .select("daily_production")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return res.status(200).json({
        daily_production: data?.daily_production ?? null,
      });
    }

    // ===== POST (insert new value) =====
    if (req.method === "POST") {
      const { daily_production } = req.body;

      if (daily_production == null || isNaN(daily_production)) {
        return res
          .status(400)
          .json({ error: "daily_production musí být číslo." });
      }

      const { error: insertErr } = await supabaseServer
        .from("eggs_settings")
        .insert([{ daily_production: Number(daily_production) }]);

      if (insertErr) throw insertErr;

      return res.status(200).json({ success: true });
    }

    // Unsupported method
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("eggs-settings API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
