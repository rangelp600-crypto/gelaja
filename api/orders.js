// api/orders.js – Pedidos (criação + consulta + atualização de status pelo admin)
const { createClient } = require('@supabase/supabase-js');

function supabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function isAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  return token && token === (process.env.ADMIN_PASSWORD || '25102001');
}
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = supabase();

  // ── GET ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { code, page, limit } = req.query;

    // Consulta pública por código
    if (code) {
      const { data, error } = await db
        .from('orders')
        .select('*')
        .eq('order_code', code.trim().toUpperCase())
        .single();
      if (error) return res.status(404).json({ error: 'Pedido não encontrado' });
      return res.json(data);
    }

    // Lista de pedidos (apenas admin)
    if (!isAdmin(req)) return res.status(403).json({ error: 'Não autorizado' });
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 50;
    const from = (pageNum - 1) * pageSize;

    const { data, error, count } = await db
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ orders: data, total: count, page: pageNum });
  }

  // ── POST – criar pedido (Pix ou WhatsApp) ─────────────────
  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.order_code || !b.customer_name || !b.customer_phone || !b.items) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    const { data, error } = await db
      .from('orders')
      .insert([{
        order_code:       b.order_code,
        customer_name:    b.customer_name,
        customer_phone:   b.customer_phone,
        customer_email:   b.customer_email || '',
        customer_address: b.customer_address || '',
        customer_notes:   b.customer_notes || '',
        items:            b.items,
        subtotal:         parseFloat(b.subtotal),
        total:            parseFloat(b.total),
        payment_method:   b.payment_method || 'whatsapp',
        payment_status:   'pending',
        status:           'new',
      }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // ── PUT – atualizar status do pedido (admin) ───────────────
  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Não autorizado' });
    const { id, status, payment_status } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    const updates = { updated_at: new Date().toISOString() };
    if (status)         updates.status         = status;
    if (payment_status) updates.payment_status = payment_status;
    const { data, error } = await db
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
