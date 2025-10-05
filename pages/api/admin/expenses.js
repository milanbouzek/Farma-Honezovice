import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("expenses").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json({ expenses: data });
  }

  if (req.method === "POST") {
    const { date, amount, description } = req.body;
    const { data, error } = await supabase
      .from("expenses")
      .insert([{ date, amount, description }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, expense: data[0] });
  }
}
