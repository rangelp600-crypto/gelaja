// api/settings.js – Configurações do site
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = supabase();

  // GET – retorna todas as settings como { banner: {...}, contact: {...}, pix: {...} }
  if (req.method === 'GET') {
    const { data, error } = await db.from('settings').select('*');
    if (error) return res.status(500).json({ error: error.message });
    const out = {};
    (data || []).forEach(row => { out[row.key] = row.value; });
    return res.json(out);
  }

  if (!isAdmin(req)) return res.status(403).json({ error: 'Não autorizado' });

  // PUT – upsert de uma chave: { key: 'banner', value: { title: '...', ... } }
  if (req.method === 'PUT') {
    const { key, value } = req.body || {};
    if (!key || value === undefined) return res.status(400).json({ error: 'key e value são obrigatórios' });
    const { data, error } = await db
      .from('settings')
      .upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
