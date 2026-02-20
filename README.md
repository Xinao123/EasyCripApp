# EasyCripApp (Frontend)

## PT-BR

Interface web do EasyCrip para gerenciamento de chave AES-256 por usuario
e teste pratico de criptografia de arquivos.

### Visao do produto

O frontend foi desenhado para um fluxo simples:

1. usuario cria conta e faz login
2. gera uma chave AES-256 ativa no dashboard
3. gera nonce para uso com AES-GCM
4. criptografa/descriptografa arquivo para validar o uso da chave
5. opcionalmente gera token temporario de compartilhamento (uso unico)
   para terceiro descriptografar

O app nao expoe segredo de sessao no browser e usa cookie HttpOnly
controlado pelo backend.

### Como o sistema funciona

#### Camada de UI

- `src/app/page.tsx`: entrada de registro/login
- `src/app/dashboard/page.tsx`: operacao principal (chaves, nonce, arquivos e compartilhamento)
- `src/app/account/page.tsx`: perfil, senha e sessao
- `src/app/faq/page.tsx`: guia de uso

#### Camada de API client

- `src/lib/easycrip.ts` centraliza chamadas HTTP
- valida `NEXT_PUBLIC_API_URL`
- usa `fetch(..., { credentials: "include" })` para enviar cookie de sessao
- trata erros de autenticacao de forma padronizada

#### Seguranca no frontend

- sem uso de token bearer em `localStorage`
- sem segredo no bundle (apenas `NEXT_PUBLIC_API_URL`)
- headers de seguranca configurados no Next (`next.config.ts`)
- sanitizacao de nome de arquivo no download local (UX + hardening)

### Fluxos principais

#### 1) Autenticacao

- registro: `POST /api/auth/register`
- login: `POST /api/auth/login`
- logout: `POST /api/auth/logout`
- logout global: `POST /api/auth/logout-all`
- sessao atual: `GET /api/auth/me`

#### 2) Chaves e nonce

- gerar chave: `POST /api/keys/generate`
- chave ativa: `GET /api/keys/active`
- lista de chaves: `GET /api/keys/list`

Antes de gerar nonce, a UI valida:

- formato do `key_id`
- se o `key_id` pertence ao usuario
- se o `key_id` esta ativo

#### 3) Arquivos (teste pratico)

- criptografar arquivo: `POST /api/files/encrypt`
- descriptografar arquivo (dono): `POST /api/files/decrypt`
- gerar token compartilhado: `POST /api/files/share-token`
- descriptografar com token compartilhado: `POST /api/files/decrypt-shared`

Regras de UX aplicadas:

- limite exibido no frontend (MVP ate 5MB)
- fluxo de compartilhamento explicito (arquivo `.easycrip` + token temporario)
- nomes de download tratados para evitar caracteres invalidos

### Contrato esperado do backend

Para o frontend operar corretamente em producao:

- isolamento por usuario em rotas de chave/auditoria/conta
- cookie de sessao com `HttpOnly`, `Secure` e `SameSite` corretos
- CORS restrito ao dominio real do frontend
- CSRF habilitado para operacoes com cookie
- revogacao de sessoes em troca de senha e logout global

### Configuracao minima

Arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app
```

Regra: URL completa com `https://`.

### Rodar local (resumo)

```bash
npm install
npm run dev
```

App local: `http://localhost:3000`

### Deploy (resumo)

1. subir projeto no Vercel
2. configurar `NEXT_PUBLIC_API_URL`
3. validar fluxos: auth, dashboard, conta, arquivos e compartilhamento

### Troubleshooting rapido

- `NEXT_PUBLIC_API_URL nao configurada`: faltou env
- `NEXT_PUBLIC_API_URL invalida`: URL sem `https://` ou incompleta
- `Sessao expirada`: cookie revogado/expirado, fazer login novamente
- erro de CORS: revisar `CORS_ALLOW_ORIGINS` no backend

---

## EN

Web interface for EasyCrip focused on per-user AES-256 key management
and practical file encryption testing.

### Product overview

The frontend is designed around a simple flow:

1. user signs up and logs in
2. user generates an active AES-256 key in the dashboard
3. user generates a nonce for AES-GCM usage
4. user encrypts/decrypts a file to validate key usage
5. optionally, user generates a temporary one-time share token
   so another person can decrypt

The app does not expose session secrets in the browser
and uses an HttpOnly cookie managed by the backend.

### How the system works

#### UI layer

- `src/app/page.tsx`: register/login entry
- `src/app/dashboard/page.tsx`: main operations (keys, nonce, files, sharing)
- `src/app/account/page.tsx`: profile, password, session controls
- `src/app/faq/page.tsx`: usage guide

#### API client layer

- `src/lib/easycrip.ts` centralizes HTTP calls
- validates `NEXT_PUBLIC_API_URL`
- uses `fetch(..., { credentials: "include" })` to send session cookie
- handles authentication errors consistently

#### Frontend security

- no bearer token stored in `localStorage`
- no secret exposed in the bundle (only `NEXT_PUBLIC_API_URL`)
- security headers configured in Next (`next.config.ts`)
- local download filename sanitization (UX + hardening)

### Main flows

#### 1) Authentication

- register: `POST /api/auth/register`
- login: `POST /api/auth/login`
- logout: `POST /api/auth/logout`
- global logout: `POST /api/auth/logout-all`
- current session: `GET /api/auth/me`

#### 2) Keys and nonce

- generate key: `POST /api/keys/generate`
- active key: `GET /api/keys/active`
- list keys: `GET /api/keys/list`

Before nonce generation, the UI validates:

- `key_id` format
- whether `key_id` belongs to the current user
- whether `key_id` is active

#### 3) Files (practical test)

- encrypt file: `POST /api/files/encrypt`
- decrypt file (owner): `POST /api/files/decrypt`
- generate share token: `POST /api/files/share-token`
- decrypt with share token: `POST /api/files/decrypt-shared`

Applied UX rules:

- frontend size limit shown to user (MVP up to 5MB)
- explicit sharing flow (encrypted `.easycrip` file + temporary token)
- download filename sanitation to avoid invalid characters

### Expected backend contract

For this frontend to work correctly in production:

- per-user isolation on keys/audit/account routes
- session cookie with proper `HttpOnly`, `Secure`, and `SameSite`
- CORS restricted to real frontend domain
- CSRF protection enabled for cookie-auth operations
- session revocation on password change and global logout

### Minimal configuration

`.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

Rule: use a full URL with `https://`.

### Local run (quick)

```bash
npm install
npm run dev
```

Local app: `http://localhost:3000`

### Deploy (quick)

1. deploy project to Vercel
2. set `NEXT_PUBLIC_API_URL`
3. validate flows: auth, dashboard, account, files, and sharing

### Quick troubleshooting

- `NEXT_PUBLIC_API_URL nao configurada`: missing env variable
- `NEXT_PUBLIC_API_URL invalida`: URL is incomplete or missing `https://`
- `Sessao expirada`: cookie was revoked/expired, login again
- CORS error: review backend `CORS_ALLOW_ORIGINS`
