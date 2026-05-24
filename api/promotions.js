// api/promotions.js – CRUD de promoções
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = supabase();

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('promotions')
      .select('*')
      .order('position')
      .order('id');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (!isAdmin(req)) return res.status(403).json({ error: 'Não autorizado' });

  if (req.method === 'POST') {
    const b = req.body || {};
    const { data, error } = await db
      .from('promotions')
      .insert([{
        name:           b.name,
        description:    b.description || '',
        discount_label: b.discount_label || '',
        image_url:      b.image_url || '',
        active:         b.active !== false,
        position:       parseInt(b.position) || 0,
      }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    const updates = { updated_at: new Date().toISOString(), ...fields };
    const { data, error } = await db
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    const { error } = await db.from('promotions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
