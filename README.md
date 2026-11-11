# FleetMonitor

Plataforma para gestão administrativa e financeira de frotas.

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

Gere senhas separadas com `openssl rand -hex 32`: configure uma como `POSTGRES_PASSWORD` e outra como `POSTGRES_APP_PASSWORD` no `.env` da raiz. A primeira é exclusiva para administração/migrações; a segunda é usada pela aplicação e pelo usuário PostgreSQL sem `BYPASSRLS`. Copie também `POSTGRES_APP_PASSWORD` para `api/.env`, gere uma senha para `DEMO_ADMIN_PASSWORD` e preencha `DEMO_ADMIN_EMAIL` e `DEMO_COMPANY_NAME` nesse arquivo. Use no `api/.env` `DATABASE_URL=postgres://fleetmonitor_app:<POSTGRES_APP_PASSWORD>@localhost:5432/fleetmonitor` e `MIGRATION_DATABASE_URL=postgres://fleetmonitor:<POSTGRES_PASSWORD>@localhost:5432/fleetmonitor`. **Mantenha os segredos somente nos arquivos locais, nunca no Git.** O formato hexadecimal evita caracteres especiais nas URLs.

2. Para desenvolvimento local, suba o Postgres com Compose:

```bash
docker compose up -d postgres
```

3. Provisione o papel de runtime e aplique as migrações usando as credenciais administrativas:

```bash
cd api
bun install
bun run db:provision-app-role
bun run db:migrate
```

Para um banco já atualizado pela versão anterior do projeto, execute uma única vez `bun run db:baseline` antes de `db:migrate`; o comando verifica a estrutura existente e não altera dados. Bancos legados anteriores ao isolamento por empresa devem executar `bun run db:legacy-upgrade` com `DEMO_COMPANY_NAME` configurado antes das migrações versionadas. Esse passo atribui veículos sem empresa à empresa configurada e vincula usuários pelo `company_name`; faça backup antes de atualizar. Não use `drizzle-kit push` em ambientes compartilhados ou de produção.

4. Rode a API e o frontend em desenvolvimento, em terminais separados:

```bash
cd api
bun run db:seed
bun run dev
```

Usuários da mesma empresa compartilham os veículos e motoristas, enquanto empresas diferentes ficam isoladas. A placa e o CPF são únicos dentro de cada empresa.

```bash
cd web && bun install && bun run dev
```

- API: `http://localhost:3000`
- Web: `http://localhost:5173`

O proxy `/api` do Vite usa `http://localhost:3000` nesse modo local. No Compose, o Nginx encaminha `/api` para o serviço `api` na rede interna do Docker; o navegador acessa somente o endereço do frontend.

A API permite chamadas cross-origin da origem `http://localhost:5173` por padrão no desenvolvimento. Para outros domínios, configure `CORS_ORIGINS` (importante) no ambiente da API como uma lista separada por vírgulas de origens exatas (protocolo, host e porta, sem caminhos). Não use `*`: as rotas de autenticação dependem de cookies e CORS permite credenciais.

## Implantação com Docker Compose

O Compose usa imagens de produção: o frontend é compilado e servido pelo Nginx, que encaminha `/api` para a API. O frontend e o PostgreSQL publicam portas somente em `localhost`; a API fica na rede interna do Compose. O endpoint `/health` verifica se a API está ativa e `/ready` também verifica a conexão com o banco.

1. Configure o `.env` da raiz com senhas distintas para `POSTGRES_PASSWORD` e `POSTGRES_APP_PASSWORD`, a porta do frontend e as origens CORS necessárias. Não reutilize credenciais de demonstração nem envie o `.env` ao Git.
2. Construa as imagens, inicie o banco, provisione o papel de runtime e aplique o schema antes de iniciar a aplicação:

```bash
docker compose build
docker compose up -d postgres
docker compose run --rm migrator bun run db:provision-app-role
docker compose run --rm migrator bun run db:migrate
docker compose up -d
```

Para um banco atualizado pela versão anterior, execute `docker compose run --rm migrator bun run db:baseline` uma vez antes de `db:migrate`. Em bancos anteriores à tenancy, execute `db:legacy-upgrade` com `DEMO_COMPANY_NAME` configurado antes das migrações versionadas; não execute esse upgrade em um banco com `company_id` já preenchido. Faça backup e confirme o resultado antes de atualizar a aplicação.

3. Acesse `http://localhost:${WEB_PORT:-8080}`. Em um servidor público, configure um proxy reverso com TLS (HTTPS) no host para encaminhar o tráfego a essa porta local; a API e o PostgreSQL não devem ser expostos diretamente à internet. Configure `CORS_ORIGINS` com origens públicas exatas somente se houver chamadas cross-origin diretamente à API.

O Compose inclui health checks para os serviços. A API grava logs JSON com ID de requisição, método, rota, status e duração; não inclui corpo, cookies, tokens ou mensagens de erro. Para acompanhar a inicialização e falhas:

```bash
docker compose ps
docker compose logs --follow api web postgres
```

Faça backup do banco antes de atualizações e guarde o arquivo fora do container:

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > fleetmonitor.sql
```

O arquivo de backup contém dados sensíveis; armazene-o com acesso restrito. O Compose não configura backup automático, recuperação point-in-time nem TLS. Em produção, configure backups testados/restauração, monitoramento de `/ready`, retenção de logs e um proxy reverso com TLS. A limpeza de sessões expiradas é uma tarefa agendada externa, por exemplo `docker compose run --rm migrator bun run db:sessions:purge`; agende-a e monitore o código de saída.

Limites de requisição e configuração de confiança de IP no proxy/WAF estão descritos em [ops/rate-limits.md](./ops/rate-limits.md).

### Conta pública de demonstração

Configure `PUBLIC_DEMO_PASSWORD` no `.env` com um segredo gerado (não o publique nem o coloque no Git):

```bash
openssl rand -hex 32
```

Depois de aplicar o schema, provisione a conta de forma explícita:

```bash
docker compose run --rm migrator bun run db:migrate
docker compose run --rm -e PUBLIC_DEMO_SEED_ENABLED=true public-demo-seed bun run db:seed:public-demo
```

### Veículos, manutenção e custos

Após entrar, a navegação da frota oferece `Indicadores` (`/app/overview`), `Veículos` (`/app`), `Motoristas` (`/app/drivers`), `Manutenção` (`/app/maintenance`) e `Custos` (`/app/costs`). Veículos, motoristas, ordens de manutenção e custos são isolados por empresa e persistidos no PostgreSQL. Ordens ficam vinculadas a veículos; lançamentos de custos são imutáveis e vinculados a veículos. Contas somente leitura consultam os dados, mas não podem alterá-los. A rota antiga `/app?status=maintenance` continua direcionando para a manutenção.

### Verificação da API

Execute os testes unitários e a verificação de tipos da API com Bun:

```bash
cd api
bun run test
bun run typecheck
```

Os testes unitários não precisam de conexão com o PostgreSQL. Para executar também os testes de integração contra um PostgreSQL descartável, defina `MIGRATION_DATABASE_URL`, `POSTGRES_APP_PASSWORD` e `TEST_DATABASE_URL` (papel de aplicação) e execute `bun run test:integration`. O teste verifica a adoção por baseline de um schema existente, migração limpa, RLS, acesso sem contexto, isolamento de dados, autorização HTTP e operações de veículos, motoristas, manutenção e custos. O usuário administrativo precisa criar bancos e o papel de runtime não pode ser superusuário nem ignorar RLS. Um Compose de integração isolado está disponível em `api/docker-compose.integration.yml`.

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
| GET | `/vehicles/summary` | Retorna totais e contagens por status de veículos e motoristas da empresa autenticada |
| GET | `/vehicles?page=1&pageSize=25&q=&status=all` | Lista veículos da empresa autenticada com paginação (máximo de 100 por página), busca por placa, marca, modelo ou ano e filtro opcional por status; exige sessão. Retorna `items`, `page`, `pageSize`, `totalItems`, `totalPages` e contagens por status. |
| GET | `/vehicles/:id` | Consulta um veículo (exige sessão) |
| POST | `/vehicles` | Cadastra veículo (placa, marca, modelo, ano e status; exige sessão) |
| PUT | `/vehicles/:id` | Atualiza os dados de um veículo (exige sessão) |
| DELETE | `/vehicles/:id` | Remove um veículo (exige sessão) |
| GET | `/drivers?page=1&pageSize=25&q=&status=all` | Lista motoristas da empresa autenticada com paginação e busca por nome, CPF, CNH ou telefone; exige sessão |
| GET | `/drivers/:id` | Consulta um motorista da empresa autenticada (exige sessão) |
| POST | `/drivers` | Cadastra motorista (nome, CPF, CNH, categoria, validade, telefone opcional e status; exige sessão) |
| PUT | `/drivers/:id` | Atualiza os dados de um motorista (exige sessão) |
| DELETE | `/drivers/:id` | Remove um motorista (exige sessão) |
| GET | `/maintenance?page=1&pageSize=25&status=all` | Lista ordens de manutenção da empresa da sessão |
| POST | `/maintenance` | Cria uma ordem vinculada a um veículo (exige permissão de escrita) |
| PUT | `/maintenance/:id` | Atualiza uma ordem de manutenção da empresa (exige permissão de escrita) |
| GET | `/costs?page=1&pageSize=25&category=all` | Lista custos da empresa da sessão |
| POST | `/costs` | Registra custo imutável vinculado a um veículo (exige permissão de escrita) |

`db:seed` cria somente o usuário de demonstração. Para popular uma empresa com os dez motoristas fictícios de exemplo, execute o seed indicando o nome exato da empresa existente:

```bash
docker compose run --rm -e "DRIVER_DEMO_COMPANY_NAME=FleetMonitor Demo" api bun run db:seed:drivers
```

O seed pode ser repetido com segurança: insere somente os CPFs de demonstração que ainda não existem para essa empresa e não sobrescreve cadastros existentes. Na página `Motoristas`, os cadastros ficam disponíveis para pesquisa, filtro, edição e remoção. Os botões de cadastro, edição e remoção escrevem diretamente no PostgreSQL pela API.

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
