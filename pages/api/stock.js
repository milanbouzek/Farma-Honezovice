// pages/api/stock.js
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  const { data: stock, error } = await supabase
    .from('eggs_stock')
    .select('quantity')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ quantity: stock.quantity });
}
