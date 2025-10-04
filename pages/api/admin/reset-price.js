import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Chybí ID objednávky' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ total_price: 0 })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Metoda ${req.method} není povolena`);
  }
}
