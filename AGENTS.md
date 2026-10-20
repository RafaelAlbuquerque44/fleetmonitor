# AGENTS.md — Regras e Diretrizes para Agentes de IA

Este documento define a arquitetura, convenções, padrões de código e diretrizes operacionais que todos os agentes de IA devem seguir ao trabalhar no repositório **FleetMonitor**.

---

## 1. Visão Geral do Projeto

O FleetMonitor é uma plataforma SaaS B2B focada na gestão inteligente, administrativa e financeira de frotas veiculares. Projetado para substituir processos manuais e planilhas descentralizadas, o sistema centraliza o controle de ativos operacionais, garantindo maior previsibilidade de custos, conformidade legal e eficiência na manutenção da frota. A solução atua como um ERP especializado e de alta performance, focando na inteligência de dados operacionais e no ciclo de vida dos veículos.

### Principais Pilares

- Controle de ativos (veículos) e ciclo de vida
- Pessoas operacionais (motoristas)
- Manutenção e conformidade
- Custos e previsibilidade financeira

Neste branch (`feat/stack`) o primeiro domínio de dados é **veículos**. Novas telas devem ler/escrever tabelas reais do negócio, não tabelas de demonstração.

---

## 2. Estrutura de Diretórios e Tecnologias

```
fleetmonitor/
├── docker-compose.yml
├── api/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   └── src/
│       ├── index.ts        # API Hono (health + veículos)
│       └── db/
│           ├── schema.ts   # Schema do Drizzle
│           └── index.ts    # Conexão com o Postgres
└── web/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts      # Vite + plugin do Tailwind v4
    ├── index.html
    └── src/
        ├── index.css       # @import "tailwindcss";
        ├── main.tsx
        └── App.tsx
```

- Runtime e pacotes: **Bun**
- API: **Hono**
- Banco: **PostgreSQL**
- ORM: **Drizzle**
- Frontend: **Vite + React + TypeScript + Tailwind CSS v4**

---

## 3. Convenções de Código

- Código (arquivos, funções, tabelas, rotas técnicas): inglês.
- Interface e copy visível: português (pt-BR).
- TypeScript estrito (`strict`, `noUncheckedIndexedAccess`).
- Schema e queries só em `api/src/db`.
- Variáveis de ambiente via `.env` (nunca commitar segredos). Modelo em `.env.example`.
- Frontend fala com a API pelo proxy Vite `/api` → `http://localhost:3000`.
- Pacotes novos: `bun add` / `bun add -d`, nunca npm/pnpm neste repo.
- Endpoints e UI devem refletir entidades do domínio (ex.: `vehicles`). Não criar endpoints genéricos de demo.

---

## 4. Tema (light / dark)

- Tema via classe `dark` no `<html>`.
- Tailwind v4 usa `@custom-variant dark (&:where(.dark, .dark *));`.
- Toda tela e componente novo precisa funcionar nos dois temas.
- Preferência persistida em `localStorage` na chave `theme`.

---

## 5. Git

- Branch de trabalho da stack: `feat/stack` (órfã em relação ao conteúdo anterior da `main`).
- Não misturar documentos de `docs/` com o código da stack sem pedido explícito.
- Commit só quando o usuário pedir.

---

## 6. Checklist Obrigatório para Agentes de IA

Ao receber uma tarefa no projeto FleetMonitor, o agente deve:

1. **Compreender o Escopo**: Identificar se a modificação afeta o Backend, o Frontend ou a camada de comunicação entre ambos.
2. **Garantir a Paridade de Temas**: Validar se qualquer nova tela ou componente suporta tanto o tema escuro (`dark`) quanto o tema claro (`light`).

---

## Links

- [Tailwind CSS + Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Drizzle + PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new)
- [Hono](https://hono.dev/docs)
- [Bun](https://bun.sh/docs)
