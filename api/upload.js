// api/upload.js – Upload de imagem para Supabase Storage (admin)
const { createClient } = require('@supabase/supabase-js');

function isAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  return token && token === (process.env.ADMIN_PASSWORD || '25102001');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  if (!isAdmin(req)) return res.status(403).json({ error: 'Não autorizado' });

  const { base64, filename, mimetype } = req.body || {};
  if (!base64 || !filename) return res.status(400).json({ error: 'base64 e filename obrigatórios' });

  try {
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Converte base64 para Buffer
    const buffer = Buffer.from(base64.replace(/^data:.+;base64,/, ''), 'base64');

    const ext       = filename.split('.').pop() || 'jpg';
    const safeName  = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const mime      = mimetype || `image/${ext}`;

    const { data, error } = await db.storage
      .from('product-images')
      .upload(safeName, buffer, { contentType: mime, upsert: false });

    if (error) return res.status(500).json({ error: error.message });

    const { data: { publicUrl } } = db.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return res.json({ url: publicUrl, path: data.path });
  } catch (err) {
    console.error('Erro upload:', err);
    return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
};
