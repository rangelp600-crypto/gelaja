// api/products.js – CRUD de produtos
const { createClient } = require('@supabase/supabase-js');

function supabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  return token && token === (process.env.ADMIN_PASSWORD || '25102001');
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = supabase();

  // ── GET (público) ──────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('products')
      .select('*')
      .order('position', { ascending: true })
      .order('id', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // Todas as escritas exigem autenticação admin
  if (!isAdmin(req)) return res.status(403).json({ error: 'Não autorizado' });

  // ── POST – criar produto ───────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};
    const { data, error } = await db
      .from('products')
      .insert([{
        name:        body.name,
        description: body.description || '',
        price:       parseFloat(body.price),
        promo_price: body.promo_price ? parseFloat(body.promo_price) : null,
        image_url:   body.image_url || '',
        emoji:       body.emoji || '🧊',
        category:    body.category || 'geral',
        active:      body.active !== false,
        position:    parseInt(body.position) || 0,
      }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // ── PUT – atualizar produto ────────────────────────────────
  if (req.method === 'PUT') {
    const body = req.body || {};
    const { id, ...fields } = body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });

    const updates = { updated_at: new Date().toISOString() };
    if (fields.name        !== undefined) updates.name        = fields.name;
    if (fields.description !== undefined) updates.description = fields.description;
    if (fields.price       !== undefined) updates.price       = parseFloat(fields.price);
    if (fields.promo_price !== undefined) updates.promo_price = fields.promo_price ? parseFloat(fields.promo_price) : null;
    if (fields.image_url   !== undefined) updates.image_url   = fields.image_url;
    if (fields.emoji       !== undefined) updates.emoji       = fields.emoji;
    if (fields.category    !== undefined) updates.category    = fields.category;
    if (fields.active      !== undefined) updates.active      = fields.active;
    if (fields.position    !== undefined) updates.position    = parseInt(fields.position);

    const { data, error } = await db
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // ── DELETE – remover produto ───────────────────────────────
  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
