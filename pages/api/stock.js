import { supabaseServer } from '../../lib/supabaseServerClient';

export default async function handler(req, res) {
  try {
    const { data: stock, error } = await supabaseServer
      .from('eggs_stock')
      .select('quantity')
      .limit(1)
      .maybeSingle(); // vybere první řádek, pokud existuje

    if (error) throw error;

    res.status(200).json({ quantity: stock?.quantity ?? 0 });
  } catch (err) {
    console.error("Stock API error:", err);
    res.status(500).json({ quantity: 0, error: err.message || "Server error" });
  }
}
