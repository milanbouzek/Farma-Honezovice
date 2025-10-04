import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Chybí orderId' });

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ total_price: 0 })
      .eq('id', orderId)
      .select();

    if (error) throw error;

    res.status(200).json({ success: true, orderId: data[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba při resetování ceny' });
  }
}
