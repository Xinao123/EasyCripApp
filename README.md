# EasyCripApp (Frontend)

Interface web do EasyCrip para gerenciamento de chave AES-256 por usuario e teste pratico de criptografia de arquivos.

## Visao do produto

O frontend foi desenhado para um fluxo simples:

1. usuario cria conta e faz login
2. gera uma chave AES-256 ativa no dashboard
3. gera nonce para uso com AES-GCM
4. criptografa/descriptografa arquivo para validar o uso da chave
5. opcionalmente gera token temporario de compartilhamento (uso unico) para terceiro descriptografar

O app nao expoe segredo de sessao no browser e usa cookie HttpOnly controlado pelo backend.

## Como o sistema funciona

### Camada de UI

- `src/app/page.tsx`: entrada de registro/login
- `src/app/dashboard/page.tsx`: operacao principal (chaves, nonce, arquivos e compartilhamento)
- `src/app/account/page.tsx`: perfil, senha e sessao
- `src/app/faq/page.tsx`: guia de uso

### Camada de API client

- `src/lib/easycrip.ts` centraliza chamadas HTTP
- valida `NEXT_PUBLIC_API_URL`
- usa `fetch(..., { credentials: "include" })` para enviar cookie de sessao
- trata erros de autenticacao de forma padronizada

### Seguranca no frontend

- sem uso de token bearer em `localStorage`
- sem segredo no bundle (apenas `NEXT_PUBLIC_API_URL`)
- headers de seguranca configurados no Next (`next.config.ts`)
- sanitizacao de nome de arquivo no download local (UX + hardening)

## Fluxos principais

### 1) Autenticacao

- registro: `POST /api/auth/register`
- login: `POST /api/auth/login`
- logout: `POST /api/auth/logout`
- logout global: `POST /api/auth/logout-all`
- sessao atual: `GET /api/auth/me`

### 2) Chaves e nonce

- gerar chave: `POST /api/keys/generate`
- chave ativa: `GET /api/keys/active`
- lista de chaves: `GET /api/keys/list`

Antes de gerar nonce, a UI valida:
- formato do `key_id`
- se o `key_id` pertence ao usuario
- se o `key_id` esta ativo

### 3) Arquivos (teste pratico)

- criptografar arquivo: `POST /api/files/encrypt`
- descriptografar arquivo (dono): `POST /api/files/decrypt`
- gerar token compartilhado: `POST /api/files/share-token`
- descriptografar com token compartilhado: `POST /api/files/decrypt-shared`

Regras de UX aplicadas:
- limite exibido no frontend (MVP ate 5MB)
- fluxo de compartilhamento explicito (arquivo `.easycrip` + token temporario)
- nomes de download tratados para evitar caracteres invalidos

## Contrato esperado do backend

Para o frontend operar corretamente em producao:

- isolamento por usuario em rotas de chave/auditoria/conta
- cookie de sessao com `HttpOnly`, `Secure` e `SameSite` corretos
- CORS restrito ao dominio real do frontend
- CSRF habilitado para operacoes com cookie
- revogacao de sessoes em troca de senha e logout global

## Configuracao minima

Arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app
```

Regra: URL completa com `https://`.

## Rodar local (resumo)

```bash
npm install
npm run dev
```

App local: `http://localhost:3000`

## Deploy (resumo)

1. subir projeto no Vercel
2. configurar `NEXT_PUBLIC_API_URL`
3. validar fluxos: auth, dashboard, conta, arquivos e compartilhamento

## Troubleshooting rapido

- `NEXT_PUBLIC_API_URL nao configurada`: faltou env
- `NEXT_PUBLIC_API_URL invalida`: URL sem `https://` ou incompleta
- `Sessao expirada`: cookie revogado/expirado, fazer login novamente
- erro de CORS: revisar `CORS_ALLOW_ORIGINS` no backend
