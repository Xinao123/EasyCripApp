# EasyCripApp (Frontend)

Frontend web do projeto EasyCrip para uso pessoal com chaves AES-256.

## O que o app faz

- cadastro e login de usuario
- sessao autenticada por cookie HttpOnly
- geracao de chave AES-256 por usuario
- geracao de nonce (12 bytes, base64) para uso com AES-GCM
- gestao de conta (editar username/email)
- troca de senha com revogacao de sessoes
- encerramento de sessoes em todos os dispositivos
- FAQ com guia rapido de uso

O frontend nao executa criptografia local de mensagem. O foco atual e gerenciamento de chave ativa + nonce.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Rotas

- `/`
  - tela inicial com abas de registro/login
- `/dashboard`
  - area protegida para gerar chave e nonce
- `/account`
  - pagina de conta para:
    - atualizar username/email
    - trocar senha
    - encerrar todas as sessoes ativas
- `/faq`
  - perguntas frequentes e exemplos de uso

## Fluxo de autenticacao

- login chama `POST /api/auth/login`
- backend seta cookie HttpOnly de sessao
- frontend usa `fetch(..., { credentials: "include" })`
- logout chama `POST /api/auth/logout`
- nao existe dependencia de token em `localStorage`
- sessao atual pode ser validada via `GET /api/auth/me`
- existe logout global via `POST /api/auth/logout-all`

Observacao:
- ainda existe uma limpeza defensiva de chave antiga em `localStorage` para compatibilidade de versoes anteriores.

## Endpoints de conta usados pelo frontend

- `GET /api/auth/me`
  - dados basicos da conta logada
- `PUT /api/auth/profile`
  - atualiza username e/ou email
- `POST /api/auth/change-password`
  - troca senha atual por nova senha forte
  - revoga tokens e exige novo login
- `POST /api/auth/logout-all`
  - revoga todas as sessoes do usuario

## Regras de negocio do dashboard

### Geracao de chave

- endpoint: `POST /api/keys/generate`
- gera nova chave ativa para o usuario logado
- chave ativa anterior do mesmo usuario e desativada

### Geracao de nonce

Antes de gerar nonce, o frontend valida:

1. formato do `key_id`
2. se o `key_id` existe na lista do usuario
3. se o `key_id` e o ativo atual

Somente `key_id` ativo e aceito para o fluxo de nonce exibido na UI.

## Seguranca esperada no backend (importante)

Para este frontend funcionar com seguranca em producao:

- isolamento por usuario em chaves (`/api/keys/*`)
- isolamento por usuario em auditoria (`/api/audit`)
- cookie com:
  - `AUTH_COOKIE_SECURE=true`
  - `AUTH_COOKIE_SAMESITE=none` (quando front e api em subdominios)
- CORS restrito ao dominio real do frontend
- troca de senha deve revogar sessoes existentes
- endpoints de conta devem exigir autenticacao

## Variaveis de ambiente

Crie `.env.local` com base em `.env.example`:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app
```

Regras:

- usar URL completa com `https://`
- sem barra final (o app ja normaliza, mas mantenha padrao)

## Instalacao e execucao local

```bash
npm install
npm run dev
```

Abrir:

- `http://localhost:3000`

## Scripts

```bash
npm run dev    # desenvolvimento
npm run lint   # validacao eslint
npm run build  # build de producao
npm run start  # sobe build local
```

## Estrutura (resumo)

```txt
src/
  app/
    page.tsx              # login/registro
    dashboard/page.tsx    # area protegida (chave e nonce)
    account/page.tsx      # perfil, senha e sessoes
    faq/page.tsx          # FAQ e guia de uso
    layout.tsx
    globals.css
  lib/
    easycrip.ts           # cliente HTTP e helpers
```

## Deploy no Vercel

1. importar repo do frontend
2. definir env:
   - `NEXT_PUBLIC_API_URL=https://api.seudominio.com`
3. deploy
4. validar fluxos:
   - registro
   - login
   - dashboard
   - minha conta (profile/senha/logout-all)
   - gerar chave
   - gerar nonce
   - logout

## Troubleshooting

### "NEXT_PUBLIC_API_URL nao configurada no frontend"

- faltou env no `.env.local` ou no Vercel

### "NEXT_PUBLIC_API_URL invalida"

- use URL completa: `https://...`

### "Sessao expirada. Faca login novamente."

- cookie expirou/revogado
- fazer login novamente

### Erros de CORS

- backend precisa liberar somente o dominio do frontend em `CORS_ALLOW_ORIGINS`
- fazer redeploy do backend apos alterar envs

### Login funciona, mas dashboard falha

- confirmar que backend esta setando cookie
- confirmar `credentials: include` ativo (ja esta no app)
- revisar `AUTH_COOKIE_*` no backend

## Estado atual

Frontend pronto para testes reais com foco em:

- onboarding simples
- autenticacao por cookie HttpOnly
- dashboard de chave AES-256 + nonce
- pagina de conta com controles de seguranca
- validacoes de uso para reduzir erro operacional
