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

1. Copie os arquivos de ambiente e gere segredos próprios:

```bash
cp .env.example .env
cp api/.env.example api/.env
openssl rand -hex 32
openssl rand -hex 24
```

Use o primeiro valor como `POSTGRES_PASSWORD` no `.env` da raiz e o segundo como `DEMO_ADMIN_PASSWORD` em `api/.env`. Preencha `DEMO_ADMIN_EMAIL` e `DEMO_COMPANY_NAME` somente em `api/.env`. Configure `DATABASE_URL` em `api/.env` como `postgres://fleetmonitor:<POSTGRES_PASSWORD>@localhost:5432/fleetmonitor`; mantenha os segredos somente nesses arquivos locais, nunca no Git. O formato hexadecimal gerado evita caracteres especiais na URL.

2. Para desenvolvimento local, suba o Postgres com Compose:

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

`db:push` executa a migração de isolamento antes de sincronizar o schema. Em bancos já existentes, os veículos sem empresa serão atribuídos à empresa definida por `DEMO_COMPANY_NAME`; usuários existentes serão vinculados à empresa correspondente ao `company_name` atual. Usuários da mesma empresa compartilham a frota, enquanto empresas diferentes ficam isoladas. A placa é única dentro de cada empresa.

Em outro terminal:

```bash
cd web && bun install && bun run dev
```

- API: `http://localhost:3000`
- Web: `http://localhost:5173`

O proxy `/api` do Vite usa `http://localhost:3000` nesse modo local. No Compose, o Nginx encaminha `/api` para o serviço `api` na rede interna do Docker; o navegador acessa somente o endereço do frontend.

A API permite chamadas cross-origin da origem `http://localhost:5173` por padrão no desenvolvimento. Para outros domínios, configure `CORS_ORIGINS` no ambiente da API como uma lista separada por vírgulas de origens exatas (protocolo, host e porta, sem caminhos). Não use `*`: as rotas de autenticação dependem de cookies e CORS permite credenciais.

## Implantação com Docker Compose

O Compose usa imagens de produção: o frontend é compilado e servido pelo Nginx, que encaminha `/api` para a API. O frontend e o PostgreSQL publicam portas somente em `localhost`; a API fica na rede interna do Compose. O endpoint `/health` verifica se a API está ativa e `/ready` também verifica a conexão com o banco.

1. Configure o `.env` da raiz com uma senha exclusiva para o banco, a porta do frontend e as origens CORS necessárias. Gere a senha do banco com `openssl rand -hex 32`; não reutilize credenciais de demonstração nem envie o `.env` ao Git.
2. Construa as imagens, inicie o banco e aplique o schema antes de iniciar a aplicação:

```bash
docker compose build
docker compose up -d postgres
docker compose run --rm api bun run db:push
docker compose up -d
```

3. Acesse `http://localhost:${WEB_PORT:-8080}`. Em um servidor público, configure um proxy reverso com TLS (HTTPS) no host para encaminhar o tráfego a essa porta local; a API e o PostgreSQL não devem ser expostos diretamente à internet. Configure `CORS_ORIGINS` com origens públicas exatas somente se houver chamadas cross-origin diretamente à API.

O Compose inclui health checks para os serviços. Para acompanhar a inicialização e falhas:

```bash
docker compose ps
docker compose logs --follow api web postgres
```

Faça backup do banco antes de atualizações e guarde o arquivo fora do container:

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > fleetmonitor.sql
```

O arquivo de backup contém dados sensíveis; armazene-o com acesso restrito. O Compose não configura backup automático nem TLS.

### Conta pública de demonstração

A conta pública de demonstração é isolada em uma empresa própria, contém somente veículos fictícios e permite demonstrar cadastro, edição e remoção. O e-mail padrão é `demo@fleetmonitor.invalid`; `admin@empresa.com` permanece reservado à conta existente e a senha `1234` não é aceita. Configure `PUBLIC_DEMO_PASSWORD` no `.env` com um segredo gerado (não o publique nem o coloque no Git):

```bash
openssl rand -hex 32
```

Depois de aplicar o schema, provisione a conta de forma explícita:

```bash
docker compose run --rm api bun run db:push
docker compose run --rm -e PUBLIC_DEMO_SEED_ENABLED=true public-demo-seed bun run db:seed:public-demo
```

O seed público só executa em `NODE_ENV=production`, exige senha com pelo menos 32 caracteres e a opção explícita do comando acima. Ele não altera contas existentes fora da empresa de demonstração. Guarde a senha em um secret manager e compartilhe-a apenas pelo canal apropriado. Para trocar a senha, execute novamente o seed com o novo segredo. Os veículos criados ou editados na demo ficam persistidos; executar o seed novamente não desfaz essas alterações nem remove veículos cadastrados durante a demonstração.

### Dashboard de indicadores

Após entrar, a navegação da frota oferece `Indicadores` (`/app/overview`), `Veículos` (`/app`) e `Manutenção` (`/app?status=maintenance`). A demo permite criar, editar e remover os veículos fictícios da própria empresa; não tem acesso aos dados de outras empresas. Os indicadores vêm de uma consulta agregada e isolada por empresa (`GET /vehicles/summary`) e são atualizados a cada 30 segundos enquanto a página está visível, além de permitir atualização manual. Não é streaming de eventos: a atualização pode levar até 30 segundos.

### Verificação da API

Execute os testes e a verificação de tipos da API com Bun:

```bash
cd api
bun run test
bun run typecheck
```

Os testes cobrem o health check, preflight CORS com `PUT`, bloqueio de origens não configuradas, autenticação das rotas protegidas, validação do login, entrada de veículos e parâmetros/paginação da listagem. Eles não precisam de conexão com o PostgreSQL.

### Organização do frontend

`web/src/App.tsx` seleciona a página pela rota. As telas ficam em `web/src/pages`, os componentes e tipos de veículos e o hook de estado/listagem ficam em `web/src/features/vehicles`, e as chamadas HTTP de autenticação e veículos ficam em suas respectivas pastas `api`. Ícones e utilitários de tema são compartilhados em `web/src/components` e `web/src/lib`.

## Acesso de demonstração

Depois de executar `db:push` e `db:seed`, entre com o e-mail e a senha configurados localmente. O seed exige credenciais explícitas, uma senha aleatória de pelo menos 20 caracteres e `NODE_ENV=development`; portanto, não pode ser executado em staging ou produção. Ao repetir o seed com o mesmo e-mail em desenvolvimento, a senha salva é substituída pelas credenciais configuradas. Se o banco local já contém uma conta criada com as credenciais de demonstração antigas, configure o mesmo `DEMO_ADMIN_EMAIL` e execute `db:seed` com uma nova senha para invalidar a senha antiga. Não promova para produção um banco que ainda permita autenticação com as credenciais antigas.

## Endpoints da API

As rotas de veículos exigem uma sessão iniciada. O endpoint de login cria um cookie `HttpOnly`, que o navegador envia automaticamente às próximas chamadas.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Liveness check da API |
| GET | `/ready` | Readiness check da API e do PostgreSQL |
| POST | `/auth/login` | Autentica e cria uma sessão |
| GET | `/auth/me` | Retorna a conta da sessão atual |
| POST | `/auth/logout` | Encerra a sessão atual |
| POST | `/contact` | Registra uma solicitação de contato na tabela `contact_requests` |
| GET | `/vehicles/summary` | Retorna totais e disponibilidade da frota da empresa autenticada |
| GET | `/vehicles?page=1&pageSize=25&q=&status=all` | Lista veículos da empresa autenticada com paginação (máximo de 100 por página), busca por placa, marca, modelo ou ano e filtro opcional por status; exige sessão. Retorna `items`, `page`, `pageSize`, `totalItems`, `totalPages` e contagens por status. |
| GET | `/vehicles/:id` | Consulta um veículo (exige sessão) |
| POST | `/vehicles` | Cadastra veículo (placa, marca, modelo, ano e status; exige sessão) |
| PUT | `/vehicles/:id` | Atualiza os dados de um veículo (exige sessão) |
| DELETE | `/vehicles/:id` | Remove um veículo (exige sessão) |

`db:seed` cria somente o usuário de demonstração; não insere veículos fictícios. O painel mostra apenas os registros existentes em `vehicles`. Os botões de cadastro, edição e remoção escrevem diretamente no PostgreSQL pela API.

O formulário “Fale com a gente” grava nome, e-mail, empresa opcional, mensagem e data de envio em `contact_requests`; ele não envia e-mail automaticamente. Consulte as solicitações no DBeaver:

```sql
SELECT id, name, email, company_name, message, created_at
FROM contact_requests
ORDER BY created_at DESC;
```

Para testar no Insomnia, envie `POST http://localhost:3000/auth/login` usando os valores configurados no `.env`:

```json
{
  "email": "<DEMO_ADMIN_EMAIL>",
  "password": "<DEMO_ADMIN_PASSWORD>"
}
```

Mantenha o cookie `fleetmonitor_session` recebido e teste `GET /auth/me` ou as rotas de veículos. O Insomnia pode manter o cookie automaticamente no cookie jar. `POST /auth/logout` invalida a sessão.

No DBeaver, consulte `auth_users` para demonstrar o cadastro persistido:

```sql
SELECT id, email, company_name, password_hash, created_at
FROM auth_users;
```
