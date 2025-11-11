import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Pouze GET povolen" });
  }

  try {
    const { data, error } = await supabase
      .from("preorders")
      .select("*")
      .eq("converted", false)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const total = data.reduce((sum, row) => sum + row.quantity, 0);

    res.status(200).json({
      preorders: data,
      total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
