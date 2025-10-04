import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false });

  const { id } = req.body;

  if (!id) return res.status(400).json({ success: false, error: "Chybí ID objednávky" });

  const { data, error } = await supabase
    .from('orders')
    .update({ payment_total: 0 }) // <- tady správný název sloupce
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({ success: true, order: data });
}
