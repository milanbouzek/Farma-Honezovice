// pages/api/order.js
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, quantity } = req.body;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ name, email, quantity }])
      .select();

    if (orderError) return res.status(400).json({ error: orderError.message });

    const { data: stock, error: stockError } = await supabase
      .from('eggs_stock')
      .select('id, quantity')
      .single();

    if (stockError) return res.status(400).json({ error: stockError.message });

    const newQuantity = stock.quantity - quantity;

    const { error: updateError } = await supabase
      .from('eggs_stock')
      .update({ quantity: newQuantity })
      .eq('id', stock.id);

    if (updateError) return res.status(400).json({ error: updateError.message });

    res.status(200).json({ success: true, order, remaining: newQuantity });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
