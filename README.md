# 🧊 Gela Já — Delivery de Frios e Gelados

**Stack:** Vercel · Supabase · Mercado Pago  
**Tagline:** Sua bebida, sem espera.

---

## ✅ Funcionalidades Incluídas

| Função | Status |
|--------|--------|
| Catálogo dinâmico com Supabase | ✅ |
| Atualização em tempo real (realtime) em todos os devices | ✅ |
| Carrinho com adicionar/remover quantidades | ✅ |
| Checkout completo com 3 passos | ✅ |
| Pagamento via Mercado Pago (cartão, Pix, boleto) | ✅ |
| Pagamento via Pix manual | ✅ |
| Pedido via WhatsApp | ✅ |
| Status do pedido (rastreamento por código) | ✅ |
| Admin atualiza status do pedido em tempo real | ✅ |
| Banco de dados Supabase (PostgreSQL) | ✅ |
| Upload de imagens para Supabase Storage | ✅ |
| Painel admin protegido por senha | ✅ |
| Webhook do Mercado Pago automático | ✅ |
| Design responsivo (mobile + desktop) | ✅ |

---

## 🚀 Passo a Passo — Configuração

### 1. Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project**
3. Dê um nome (ex: `gela-ja`) e defina uma senha para o banco
4. Aguarde a criação do projeto (~2 min)

### 2. Configurar o banco de dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `supabase/schema.sql`
4. Clique em **Run** — isso cria todas as tabelas, políticas e dados iniciais

### 3. Criar bucket de imagens

1. No Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome: `product-images`
4. Marque **Public bucket** ✅
5. Clique em **Create bucket**
6. Vá em **Policies** do bucket → **Add policy** → "Allow public read" (template)

### 4. Pegar as chaves do Supabase

No Supabase: **Settings → API**

Copie:
- `Project URL` → `SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY`
- `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Criar conta no Mercado Pago

1. Acesse [mercadopago.com.br](https://mercadopago.com.br) e crie uma conta
2. Vá em **Suas Integrações → Credenciais de Produção**
3. Copie:
   - `Access Token` → `MP_ACCESS_TOKEN`
   - `Public Key` → `MP_PUBLIC_KEY`

> ⚠️ **Importante:** Para testar antes de ir ao ar, use as **Credenciais de Sandbox** (modo teste).

### 6. Configurar o `index.html`

Abra o arquivo `index.html` e localize no início do `<script>`:

```javascript
const SUPABASE_URL      = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...SUA_CHAVE_ANON...';
```

Substitua pelos seus valores reais do Supabase.

### 7. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta GitHub
2. Faça upload do projeto ou conecte o repositório
3. Na tela de configuração, vá em **Environment Variables** e adicione:

```
SUPABASE_URL              = https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJ...sua_service_role_key...
ADMIN_PASSWORD            = SUA_SENHA_SEGURA
MP_ACCESS_TOKEN           = APP_USR-...seu_access_token...
SITE_URL                  = https://seu-site.vercel.app
```

4. Clique em **Deploy**

### 8. Configurar Webhook do Mercado Pago

Após fazer o deploy e ter sua URL Vercel:

1. No painel do Mercado Pago → **Suas Integrações → Webhooks**
2. Adicione um novo webhook:
   - URL: `https://SEU_SITE.vercel.app/api/webhook`
   - Evento: **Pagamentos** ✅
3. Salve

Isso garante que o status do pedido atualiza automaticamente após o pagamento.

---

## 📁 Estrutura do Projeto

```
gela-ja/
├── index.html                  # Frontend completo
├── logo.png                    # Logotipo do site
├── vercel.json                 # Configuração Vercel
├── package.json                # Dependências Node.js
├── .env.example                # Variáveis de ambiente (template)
├── api/
│   ├── auth.js                 # Autenticação admin
│   ├── products.js             # CRUD de produtos
│   ├── promotions.js           # CRUD de promoções
│   ├── settings.js             # Configurações do site
│   ├── orders.js               # Pedidos (criar/consultar/atualizar)
│   ├── create-preference.js    # Criar preferência Mercado Pago
│   ├── webhook.js              # Webhook Mercado Pago
│   └── upload.js               # Upload de imagens
└── supabase/
    └── schema.sql              # Schema do banco de dados
```

---

## 🔄 Como Funciona o Realtime

Quando o admin atualiza um produto (preço, nome, imagem, estoque):
- O Supabase notifica **todos os clientes conectados** via WebSocket
- O catálogo atualiza automaticamente sem precisar recarregar a página
- Funciona em todos os dispositivos, incluindo contas novas

---

## 🛒 Fluxo do Pedido

```
Cliente → Adiciona produtos ao carrinho
       → Abre checkout → Preenche dados pessoais
       → Escolhe pagamento:
           ├── Mercado Pago → Redireciona para MP → Webhook atualiza pedido
           ├── Pix manual   → Mostra QR Code → Cliente envia comprovante WhatsApp
           └── WhatsApp     → Monta mensagem com pedido → Abre WhatsApp
       → Recebe código do pedido
       → Acompanha status em "📦 Meu Pedido"
```

---

## ⚙️ Painel Administrativo

Acesse clicando em **"Admin"** no topo do site. Funções:

| Aba | O que faz |
|-----|-----------|
| **Produtos** | Adicionar, editar, excluir produtos com upload de foto |
| **Promoções** | Gerenciar promoções e destaques |
| **Pedidos** | Ver todos os pedidos e atualizar status |
| **Banner** | Editar título e subtítulo do hero |
| **Pix** | Configurar chave Pix e QR Code |
| **Contato** | Editar WhatsApp, endereço, horário, e-mail |

---

## 🔐 Segurança

- Chave Supabase `anon` é segura para expor no frontend (protegida por RLS)
- Chave `service_role` **nunca** fica no frontend — só nas Vercel Environment Variables
- Todas as escritas do admin passam pelo backend com verificação de senha
- Senha do admin definida na variável `ADMIN_PASSWORD` (Vercel)

---

## 📱 Testando Pagamentos (Sandbox MP)

Use as credenciais de sandbox do Mercado Pago:
- [Criar contas de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/create-test-users)
- Cartões de teste: [Ver lista](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)

---

## 🆘 Suporte

Problemas comuns:
- **"Supabase URL inválida"**: Verifique se substituiu `SUPABASE_URL` e `SUPABASE_ANON_KEY` no `index.html`
- **"Erro 403 no admin"**: Verifique `ADMIN_PASSWORD` nas variáveis da Vercel
- **"Pagamento não atualiza"**: Verifique se o webhook do MP está configurado com a URL correta
- **"Imagem não aparece"**: Confirme que o bucket `product-images` é público
