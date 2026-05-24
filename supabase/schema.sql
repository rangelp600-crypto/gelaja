-- ============================================================
-- GELA JÁ – SCHEMA SUPABASE
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABELAS ──────────────────────────────────────────────────

-- Produtos
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  price       NUMERIC(10,2) NOT NULL,
  promo_price NUMERIC(10,2),
  image_url   TEXT DEFAULT '',
  emoji       TEXT DEFAULT '🧊',
  category    TEXT DEFAULT 'geral',
  active      BOOLEAN DEFAULT true,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Promoções
CREATE TABLE IF NOT EXISTS promotions (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT DEFAULT '',
  discount_label TEXT DEFAULT '',
  image_url      TEXT DEFAULT '',
  active         BOOLEAN DEFAULT true,
  position       INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do site (chave–valor JSON)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id               BIGSERIAL PRIMARY KEY,
  order_code       TEXT UNIQUE NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  customer_notes   TEXT DEFAULT '',
  items            JSONB NOT NULL,
  subtotal         NUMERIC(10,2) NOT NULL,
  total            NUMERIC(10,2) NOT NULL,
  payment_method   TEXT NOT NULL DEFAULT 'whatsapp',
  -- pending | approved | rejected | cancelled | in_process
  payment_status   TEXT NOT NULL DEFAULT 'pending',
  mp_preference_id TEXT,
  mp_payment_id    TEXT,
  -- new | confirmed | preparing | delivering | delivered | cancelled
  status           TEXT NOT NULL DEFAULT 'new',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;

-- Leitura pública (anon key)
CREATE POLICY "public_read_products"   ON products   FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_promotions" ON promotions FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_settings"   ON settings   FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_orders"     ON orders     FOR SELECT TO anon USING (true);

-- Inserção pública (pedidos criados pelo cliente)
CREATE POLICY "public_insert_orders" ON orders FOR INSERT TO anon WITH CHECK (true);

-- ── REALTIME ─────────────────────────────────────────────────
-- Habilita atualizações em tempo real para todos os clientes

ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE promotions;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ── DADOS INICIAIS ───────────────────────────────────────────

INSERT INTO settings (key, value) VALUES
  ('banner',  '{"title":"Fresquinho e gelado na sua porta!","subtitle":"Produtos frios e congelados com qualidade e agilidade. Peça agora!","strip":"Frete grátis para compras acima de R$50,00! 🎉"}'::jsonb),
  ('contact', '{"waNumber":"31999998888","address":"Santa Luzia, MG","hours":"Segunda a Sábado, 8h às 20h","email":"contato@gelaja.com.br"}'::jsonb),
  ('pix',     '{"key":"","name":"","qr":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO products (name, description, price, promo_price, emoji, category, position) VALUES
  ('Sorvete de Creme 2L',          'Cremoso e delicioso, sabor baunilha tradicional.',         22.90, NULL,  '🍦', 'sorvetes',   1),
  ('Picolé de Morango',            'Picolé artesanal com polpa de morango real.',               4.50, NULL,  '🍓', 'picolés',    2),
  ('Açaí 500ml',                   'Açaí puro batido na hora com granola e banana.',           18.00, 14.90, '🫐', 'açaí',       3),
  ('Água de Coco 330ml',           'Refrescante e natural, diretamente do coco.',               6.00, NULL,  '🥥', 'bebidas',    4),
  ('Frango Congelado 1kg',         'Peito de frango congelado, livre de antibióticos.',        19.90, NULL,  '🍗', 'congelados', 5),
  ('Gelinho da Alegria (pct 50un)','O clássico gelinho colorido, perfeito para o calor!',      15.00, 12.00, '🧃', 'gelinhos',   6)
ON CONFLICT DO NOTHING;

INSERT INTO promotions (name, description, discount_label, active, position) VALUES
  ('Combo do Calor!', 'Leve 3 picolés e pague apenas 2. Válido de segunda a sexta.', 'LEVE 3 PAGUE 2', true, 1),
  ('Açaí Especial',   'Açaí 500ml com cobertura de chocolate por um preço especial.', '20% OFF',        true, 2)
ON CONFLICT DO NOTHING;

-- ── STORAGE (execute manualmente no painel Storage) ──────────
-- 1. Crie o bucket: product-images
-- 2. Marque como "Public bucket"
-- 3. Adicione a policy: allow public read (SELECT)
-- 4. Para admin upload, use a service_role key no backend
