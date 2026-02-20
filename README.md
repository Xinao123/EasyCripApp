# EasyCripApp (Frontend)

## PT-BR

### O que e este projeto

O **EasyCripApp** e o frontend open source do EasyCrip.
Ele foi criado para oferecer uma experiencia simples de uso de criptografia,
sem foco comercial, com objetivo educacional e de uso pessoal.

A proposta e transformar um fluxo tecnico (chave, nonce, criptografar,
descriptografar, compartilhar com segurança) em uma interface clara
para usuarios nao especialistas.

### Objetivo

- facilitar o uso pratico de chaves AES-256 por usuario
- reduzir erro operacional no fluxo AES-GCM
- disponibilizar um exemplo real de produto com foco em seguranca
- evoluir em comunidade (open source)

### Como funciona (visao geral)

Fluxo principal do usuario:

1. cria conta e faz login
2. gera uma chave AES-256 ativa
3. gera nonce para uso com AES-GCM
4. criptografa/descriptografa arquivos para teste real
5. pode gerar token temporario (uso unico) para compartilhamento seguro

### Arquitetura do frontend

- `src/app/page.tsx`: entrada (registro/login)
- `src/app/dashboard/page.tsx`: operacao principal (chaves, nonce e arquivos)
- `src/app/account/page.tsx`: perfil, senha e sessoes
- `src/app/faq/page.tsx`: orientacao de uso
- `src/lib/easycrip.ts`: cliente HTTP e regras comuns de comunicacao

### Modelo de seguranca (frontend)

- sessao baseada em cookie HttpOnly (gerenciado no backend)
- sem token bearer persistido no `localStorage`
- sem segredo no bundle (somente variavel publica de URL da API)
- headers de seguranca no Next.js
- sanitizacao de nome de arquivo no download

### O que este frontend nao faz

- nao substitui politica de seguranca do backend
- nao faz promessas de "anonimato total"
- nao e uma plataforma comercial de KMS/HSM

### Estado atual

O projeto ja cobre:

- autenticacao e gestao de conta
- gerenciamento de chave ativa
- geracao de nonce
- criptografia/descriptografia de arquivos para validacao pratica
- fluxo de compartilhamento com token temporario

### Roadmap (alto nivel)

- melhorar UX para usuarios nao tecnicos
- ampliar observabilidade funcional sem expor dados sensiveis
- expandir documentacao de uso real
- evoluir com contribuicoes da comunidade

### Open source e contribuicao

Projeto aberto para estudo, auditoria e contribuicao.
Feedback tecnico (UX, arquitetura, seguranca) e bem-vindo.

---

## EN

### What this project is

**EasyCripApp** is the open-source frontend of EasyCrip.
It was created as a non-profit project focused on education
and personal use.

The goal is to make a technical crypto workflow (key, nonce,
encrypt, decrypt, secure sharing) easier to understand
for non-specialist users.

### Goal

- make per-user AES-256 usage practical
- reduce operational mistakes in AES-GCM workflows
- provide a real product-like example with security focus
- evolve in public with community feedback

### How it works (high level)

Main user flow:

1. sign up and log in
2. generate an active AES-256 key
3. generate a nonce for AES-GCM
4. encrypt/decrypt files in a real test flow
5. optionally generate a temporary one-time share token

### Frontend architecture

- `src/app/page.tsx`: entry point (register/login)
- `src/app/dashboard/page.tsx`: main operations (keys, nonce, files)
- `src/app/account/page.tsx`: profile, password, sessions
- `src/app/faq/page.tsx`: usage guidance
- `src/lib/easycrip.ts`: HTTP client and shared communication rules

### Security model (frontend)

- session based on HttpOnly cookie (managed by backend)
- no bearer token persisted in `localStorage`
- no secret exposed in the bundle (only public API URL env)
- security headers configured in Next.js
- download filename sanitization

### What this frontend is not

- not a replacement for backend security controls
- not a "full anonymity" solution
- not a commercial KMS/HSM platform

### Current status

The project already includes:

- authentication and account management
- active key management
- nonce generation
- file encryption/decryption practical flow
- temporary token sharing flow

### Roadmap (high level)

- improve UX for non-technical users
- improve functional observability without exposing sensitive data
- expand real-world usage documentation
- continue evolving through community contributions

### Open-source and contributions

This project is open for study, auditing, and contribution.
Technical feedback (UX, architecture, security) is welcome.
