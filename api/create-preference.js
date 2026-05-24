// api/create-preference.js – Cria preferência de pagamento no Mercado Pago
const { createClient } = require('@supabase/supabase-js');

function supabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { order_code, items, customer, total } = req.body || {};

  if (!order_code || !items || !customer || !total) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const siteUrl = process.env.SITE_URL || 'https://gela-ja.vercel.app';

  // Monta preferência do Mercado Pago
  const preference = {
    items: items.map(item => ({
      title:      item.name,
      quantity:   parseInt(item.quantity),
      unit_price: parseFloat(item.price),
      currency_id: 'BRL',
    })),
    payer: {
      name:  customer.name || '',
      email: customer.email || 'cliente@gelaja.com.br',
      phone: {
        area_code: (customer.phone || '').replace(/\D/g, '').substring(0, 2),
        number:    (customer.phone || '').replace(/\D/g, '').substring(2),
      },
    },
    external_reference: order_code,
    back_urls: {
      success: `${siteUrl}?order=${order_code}&payment=success`,
      failure: `${siteUrl}?order=${order_code}&payment=failure`,
      pending: `${siteUrl}?order=${order_code}&payment=pending`,
    },
    auto_return:         'approved',
    notification_url:    `${siteUrl}/api/webhook`,
    statement_descriptor: 'GELA JA DELIVERY',
    payment_methods: {
      excluded_payment_types: [],
      installments: 1,
    },
  };

  try {
    // Cria preferência via API do Mercado Pago
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type':  'application/json',
        'X-Idempotency-Key': order_code,
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Erro MP:', mpData);
      return res.status(500).json({ error: 'Erro ao criar preferência MP', detail: mpData });
    }

    // Salva pedido no Supabase com status pending
    const db = supabase();
    await db.from('orders').insert([{
      order_code,
      customer_name:    customer.name,
      customer_phone:   customer.phone,
      customer_email:   customer.email || '',
      customer_address: customer.address || '',
      customer_notes:   customer.notes || '',
      items,
      subtotal: parseFloat(total),
      total:    parseFloat(total),
      payment_method:   'mercadopago',
      payment_status:   'pending',
      mp_preference_id: mpData.id,
      status:           'new',
    }]);

    return res.json({
      preference_id:        mpData.id,
      init_point:           mpData.init_point,
      sandbox_init_point:   mpData.sandbox_init_point,
    });

  } catch (err) {
    console.error('Erro create-preference:', err);
    return res.status(500).json({ error: 'Erro interno ao processar pagamento' });
  }
};
