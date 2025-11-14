import { supabaseServer } from "../../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseServer
      .from("preorders")
      .select("standardQty, lowcholQty");

    if (error) throw error;

    const total = (data || []).reduce(
      (sum, r) => sum + (r.standardQty || 0) + (r.lowcholQty || 0),
      0
    );

    res.status(200).json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
