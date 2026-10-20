# FleetMonitor

Plataforma SaaS B2B para gestão administrativa e financeira de frotas. Este branch (`feat/stack`) inicia pela stack e pelas convenções do repositório.

## Stack

- **Bun** — runtime e gerenciador de pacotes
- **Hono** — API
- **PostgreSQL** + **Drizzle ORM**
- **Vite + React + TypeScript**
- **Tailwind CSS v4**
- **Docker Compose** — Postgres, API e web

## Como rodar

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
cp api/.env.example api/.env
```

2. Suba o Postgres (e, se quiser, API e web) com Compose:

```bash
docker compose up -d postgres
```

3. Instale dependências e rode em desenvolvimento:

```bash
cd api
bun install
bun run db:push
bun run db:seed
bun run dev
```

Em outro terminal:

```bash
cd web && bun install && bun run dev
```

- API: `http://localhost:3000`
- Web: `http://localhost:5173`

## Acesso de demonstração

Depois de executar `db:push` e `db:seed`, use:

- **E-mail:** `admin@empresa.com`
- **Senha:** `1234`

O seed cria a empresa **Empresa Demo** e guarda a senha com hash Argon2id na tabela `auth_users`; a senha não é persistida em texto puro. Esses valores são exclusivos para demonstração local. Altere as variáveis `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD` e `DEMO_COMPANY_NAME` nos arquivos `.env` antes de usar outro ambiente.

## Endpoints da API

As rotas de veículos exigem uma sessão iniciada. O endpoint de login cria um cookie `HttpOnly`, que o navegador envia automaticamente às próximas chamadas.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/auth/login` | Autentica e cria uma sessão |
| GET | `/auth/me` | Retorna a conta da sessão atual |
| POST | `/auth/logout` | Encerra a sessão atual |
| GET | `/vehicles?q=` | Lista veículos reais (filtro opcional por placa ou modelo; exige sessão) |
| GET | `/vehicles/:id` | Consulta um veículo (exige sessão) |
| POST | `/vehicles` | Cadastra veículo (placa, marca, modelo, ano e status; exige sessão) |
| PUT | `/vehicles/:id` | Atualiza os dados de um veículo (exige sessão) |
| DELETE | `/vehicles/:id` | Remove um veículo (exige sessão) |

`db:seed` cria somente o usuário de demonstração; não insere veículos fictícios. O painel mostra apenas os registros existentes em `vehicles`. Os botões de cadastro, edição e remoção escrevem diretamente no PostgreSQL pela API.

Para testar no Insomnia, envie `POST http://localhost:3000/auth/login` com:

```json
{
  "email": "admin@empresa.com",
  "password": "1234"
}
```

Mantenha o cookie `fleetmonitor_session` recebido e teste `GET /auth/me` ou as rotas de veículos. O Insomnia pode manter o cookie automaticamente no cookie jar. `POST /auth/logout` invalida a sessão.

No DBeaver, consulte `auth_users` para demonstrar o cadastro persistido:

```sql
SELECT id, email, company_name, password_hash, created_at
FROM auth_users;
```
