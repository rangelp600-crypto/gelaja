// api/auth.js – Autenticação do painel admin
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { password } = req.body || {};
  const adminPass = process.env.ADMIN_PASSWORD || '25102001';

  if (!password || password !== adminPass) {
    return res.status(401).json({ success: false, error: 'Senha incorreta' });
  }

  // Token simples: a própria senha serve como bearer token
  // O backend valida comparando com a env var ADMIN_PASSWORD
  return res.json({ success: true, token: adminPass });
};
