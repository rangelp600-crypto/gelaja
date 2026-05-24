// api/webhook.js – Recebe notificações do Mercado Pago e atualiza pedidos
const { createClient } = require('@supabase/supabase-js');

function supabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

module.exports = async function handler(req, res) {
  // Aceita GET (MP envia ping) e POST (notificação real)
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const { type, data } = body;

  // Só processa notificações de pagamento
  if (type !== 'payment' || !data?.id) {
    return res.status(200).json({ received: true });
  }

  try {
    // Busca detalhes do pagamento na API do MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();

    if (!payment.external_reference) {
      console.warn('Webhook sem external_reference:', payment.id);
      return res.status(200).json({ received: true });
    }

    // Mapeia status do MP para status do pedido
    const statusMap = {
      approved:    { payment_status: 'approved',    status: 'confirmed'  },
      rejected:    { payment_status: 'rejected',    status: 'cancelled'  },
      cancelled:   { payment_status: 'cancelled',   status: 'cancelled'  },
      in_process:  { payment_status: 'in_process',  status: 'new'        },
      pending:     { payment_status: 'pending',     status: 'new'        },
      refunded:    { payment_status: 'cancelled',   status: 'cancelled'  },
    };

    const mapped = statusMap[payment.status] || { payment_status: payment.status, status: 'new' };

    const db = supabase();
    const { error } = await db
      .from('orders')
      .update({
        payment_status:   mapped.payment_status,
        status:           mapped.status,
        mp_payment_id:    String(data.id),
        updated_at:       new Date().toISOString(),
      })
      .eq('order_code', payment.external_reference);

    if (error) console.error('Erro ao atualizar pedido:', error);

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Erro webhook:', err);
    // Sempre retorna 200 pro MP não reenviar
    return res.status(200).json({ received: true });
  }
};
