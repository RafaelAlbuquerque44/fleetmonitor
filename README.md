# FleetMonitor

Plataforma para gestão administrativa e financeira de frotas.

## Stack

- **Bun** — runtime e gerenciador de pacotes
- **Hono** — API
- **PostgreSQL** + **Drizzle ORM**
- **Vite + React + TypeScript**
- **Tailwind CSS v4**
- **Docker Compose** — Postgres, API, web e Ollama (perfil opcional `ai`)

## Iniciar com Docker Compose

Configure `.env` a partir de `.env.example` e então execute:

```bash
docker compose up -d postgres
```

```bash
docker compose build
docker compose run --rm migrator bun run db:provision-app-role
docker compose run --rm migrator bun run db:migrate
docker compose up -d
```

Aplicação: `http://localhost:8080`. Para desenvolvimento sem Docker, veja as
instruções de configuração nos arquivos `.env.example` e os scripts em cada
diretório da aplicação.

As tabelas de negócio no PostgreSQL usam nomes pt-BR, como `empresas`,
`veiculos`, `abastecimentos`, `registros_manutencao` e `pneus`. Os identificadores
do código e as rotas técnicas da API continuam em inglês.

Após entrar, a navegação da frota oferece `Indicadores` (`/app/overview`), `Veículos` (`/app`), `Manutenção` (`/app/maintenance`), `Motoristas` (`/app/drivers`), `Exportação` (`/app/exports`) e `Assistente IA` (`/app/assistant`). Em Manutenção, use as abas para consultar a manutenção preventiva, abastecimentos, ocorrências e pneus. Na aba Preventiva, configure intervalos por quilometragem para óleo e pastilhas, registre as leituras do hodômetro por motorista e anote serviços como lavagem. Os alertas são calculados a partir da última leitura salva. O cadastro de veículos também aceita número de chassi. Veículos e motoristas são isolados por empresa e persistidos no PostgreSQL. Contas somente leitura consultam os dados, mas não podem alterá-los. A situação `Em manutenção` permanece como um status do veículo.

Para habilitar o assistente local, inicie também o perfil de IA e baixe o modelo
configurado (na primeira execução, o download pode levar alguns minutos):

```bash
docker compose --profile ai up -d
docker compose exec ollama ollama pull qwen2.5:3b
```

Os modelos baixados ficam no volume `ollama_data`. O assistente exige uma sessão
autenticada e não consulta automaticamente os registros da empresa. O histórico
é salvo por usuário, pode ser reaberto e excluído na tela do assistente.
Para usar outro modelo ou endereço Ollama, configure `OLLAMA_MODEL` ou
`OLLAMA_BASE_URL` no ambiente da API. Para execução local da API fora do Docker,
use `OLLAMA_BASE_URL=http://localhost:11434`.

O projeto inclui um roteiro passo a passo em [Tutorial de uso](./docs/tutorial-usuario.md).

Ao atualizar o código, execute `bun run db:migrate` no diretório `api` com
`MIGRATION_DATABASE_URL` configurada para o usuário responsável pelas migrações,
antes de iniciar ou atualizar a API. A conexão da aplicação deve usar um usuário
sem privilégios de superusuário ou de bypass de RLS. Com Docker Compose, execute
`docker compose run --rm migrator bun run db:migrate` após reconstruir a imagem.

```bash
cd api
bun run test
bun run typecheck
```

## Endpoints da API

As rotas de veículos exigem uma sessão iniciada. O endpoint de login cria um cookie `HttpOnly`, que o navegador envia automaticamente às próximas chamadas.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Liveness check da API |
| GET | `/ready` | Readiness check da API e do PostgreSQL |
| POST | `/auth/login` | Autentica e cria uma sessão |
| GET | `/auth/me` | Retorna a conta da sessão atual |
| POST | `/auth/logout` | Encerra a sessão atual |
| POST | `/contact` | Registra uma solicitação de contato na tabela `solicitacoes_contato` |
| GET | `/vehicles/summary` | Retorna totais e contagens por status de veículos e motoristas da empresa autenticada |
| GET | `/vehicles?page=1&pageSize=25&q=&status=all` | Lista veículos da empresa autenticada com paginação (máximo de 100 por página), busca por placa, marca, modelo ou ano e filtro opcional por status; exige sessão. Retorna `items`, `page`, `pageSize`, `totalItems`, `totalPages` e contagens por status. |
| GET | `/vehicles/:id` | Consulta um veículo (exige sessão) |
| POST | `/vehicles` | Cadastra veículo (placa, marca, modelo, ano e status; exige sessão) |
| PUT | `/vehicles/:id` | Atualiza os dados de um veículo (exige sessão) |
| DELETE | `/vehicles/:id` | Remove um veículo (exige sessão) |
| GET | `/drivers?page=1&pageSize=25&q=&status=all` | Lista motoristas da empresa autenticada com paginação e busca por nome, CPF, CNH ou telefone; exige sessão |
| GET | `/drivers/alerts` | Lista CNHs próximas do vencimento de motoristas ativos da empresa autenticada |
| GET | `/drivers/:id` | Consulta um motorista da empresa autenticada (exige sessão) |
| POST | `/drivers` | Cadastra motorista (nome, CPF, CNH, categoria, validade, telefone opcional e status; exige sessão) |
| PUT | `/drivers/:id` | Atualiza os dados de um motorista (exige sessão) |
| DELETE | `/drivers/:id` | Remove um motorista (exige sessão) |
| GET | `/exports/:type` | Retorna os dados da empresa para exportação; `type` é `vehicles` ou `drivers` |
| GET | `/ai/sessions` | Lista as conversas do usuário autenticado |
| POST | `/ai/sessions` | Cria uma conversa |
| GET | `/ai/sessions/:id` | Carrega uma conversa e suas mensagens |
| DELETE | `/ai/sessions/:id` | Exclui uma conversa e suas mensagens |
| POST | `/ai/sessions/:id/messages` | Envia mensagem ao modelo Ollama e salva a troca na conversa |

Para carregar motoristas de exemplo na empresa de demonstração existente, execute
`bun run db:seed:drivers` em `api`, definindo `DRIVER_DEMO_COMPANY_NAME` com o nome
exato da empresa. Para adicionar abastecimentos, manutenções, pneus e histórico
de pneus à empresa local, defina `DEMO_COMPANY_NAME` e execute
`bun run db:seed:records-demo`; o seed é idempotente e não pode ser executado em
produção. Para preparar a conta local `admin@fleetmonitor.com` (senha `admin`) com
uma massa completa de demonstração (veículos em todas as situações, desvios de
consumo, manutenções e pneus com alertas), execute `bun run db:seed:admin-demo` em
`api`; o comando recria os registros dessa empresa e só roda fora de produção
contra banco local.