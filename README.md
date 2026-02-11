# EasyCripApp (Frontend)

Frontend web do projeto EasyCrip, focado em uso pessoal para:

- cadastro e login de usuario
- geracao de chave AES-256
- geracao de nonce associado ao `key_id` ativo (AES-GCM)
- consulta de FAQ e guia rapido de uso

Stack principal:

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Objetivo do app

Este frontend foi desenhado para fluxo simples e real:

1. usuario cria conta
2. usuario faz login
3. usuario entra no dashboard protegido
4. usuario gera chave AES-256
5. usuario gera nonce para o `key_id` ativo

Nao existe fluxo de "criptografar mensagem" no frontend atual. O foco e geracao de chave/nonce e experiencia de uso.

## Rotas

- `/`  
  Tela inicial com abas de `Registrar` e `Login`.

- `/dashboard`  
  Area protegida por sessao com:
  - dados da chave ativa
  - botao para gerar nova chave AES-256
  - geracao de nonce com validacao de `key_id`

- `/faq`  
  Perguntas frequentes, passo a passo e boas praticas.

## Requisitos

- Node.js 20+ (recomendado)
- npm 10+ (ou equivalente)
- Backend EasyCrip online (Vercel/local)

## Variaveis de ambiente

Crie um arquivo `.env.local` com base no `.env.example`:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app
```

Importante:

- `NEXT_PUBLIC_API_URL` deve ser URL completa com `https://`
- essa variavel e obrigatoria para registro/login/dashboard

## Instalacao e execucao local

```bash
npm install
npm run dev
```

Abra:

- `http://localhost:3000`

## Scripts

```bash
npm run dev    # desenvolvimento
npm run lint   # validacao eslint
npm run build  # build de producao
npm run start  # sobe build local
```

## Fluxo de sessao

- apos login, o token e salvo no `localStorage` em `easycrip_token`
- se token existir, `/` redireciona para `/dashboard`
- se token expirar/invalido, o app limpa sessao e redireciona para `/`

## Regras de negocio implementadas no dashboard

### Geracao de chave AES-256

- chamada ao backend: `POST /api/keys/generate`
- atualiza chave ativa na tela

### Geracao de nonce

Antes de gerar nonce, o frontend valida:

1. formato do `key_id` (caracteres e tamanho)
2. existencia do `key_id` no backend
3. se o `key_id` e o ativo atual

Somente `key_id` ativo e aceito.
O nonce gerado usa 12 bytes (base64), adequado para AES-GCM.

Chamada usada para validacao:

- `GET /api/keys/list`

Saida exibida:

- `nonce` em base64
- bundle JSON:
  - `key_id`
  - `nonce`
  - `algorithm`
  - `generated_at`

## Estrutura de pastas (resumo)

```txt
src/
  app/
    page.tsx              # tela de login/registro
    dashboard/page.tsx    # area protegida (chave e nonce)
    faq/page.tsx          # FAQ e guia de uso
    layout.tsx
    globals.css
  lib/
    easycrip.ts           # cliente API, sessao e helpers
```

## Deploy no Vercel

1. Importar o repo do frontend no Vercel
2. Definir env var:
   - `NEXT_PUBLIC_API_URL` = URL do backend
3. Fazer deploy
4. Testar:
   - registro/login
   - acesso ao dashboard
   - geracao de chave
   - geracao de nonce com `key_id` ativo

## Troubleshooting

### "NEXT_PUBLIC_API_URL nao configurada no frontend"

- faltou definir a variavel no `.env.local` (local) ou no projeto Vercel

### "Sessao expirada. Faca login novamente."

- token expirou ou foi invalidado
- faca login novamente

### "key_id nao encontrado" / "key_id nao esta ativo"

- confirme se voce gerou chave no usuario logado
- atualize chave ativa no dashboard
- use apenas o `key_id` ativo atual

### Erros de CORS

- backend precisa permitir o dominio do frontend em `CORS_ALLOW_ORIGINS`
- redeploy backend apos alterar envs

## Estado atual

Frontend pronto para testes reais de produto:

- onboarding (home + FAQ)
- autenticacao
- dashboard focado em chave AES-256 + nonce (AES-GCM)
- validacoes de uso para reduzir erro do usuario
