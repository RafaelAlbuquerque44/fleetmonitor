# FleetMonitor

Gestão de frotas com frontend React/TypeScript e API Django REST Framework. A interface atual funciona como demonstração local (`admin / admin`), com cadastros em `localStorage` por conta; os cadastros ainda não estão integrados à API JWT. A conta **Admin Global (Demo)**, ID `999999`, funciona sem backend.

Consulte a [revisão de arquitetura](docs/architecture-review.md) para correções, validações e pendências, especialmente o isolamento multi-tenant no servidor.

## Tecnologias Utilizadas

- **React 19 / TypeScript / Vite 7 / Tailwind CSS v4**: SPA com temas claro e escuro.
- **Django**: 5.2 LTS.
- **Django REST Framework (DRF)**: Construção rápida de APIs.
- **PostgreSQL**: Banco de dados relacional.
- **Simple JWT**: Autenticação nativa baseada em Token JWT.
- **Docker**: Containerização completa da solução.

---

## 🚀 Como Executar Localmente

### Usando Docker (Recomendado)

1. Certifique-se de que tenha o **Docker** e o **Docker Compose** instalados na sua máquina.
2. Copie `.env.example` para `.env` na raiz e substitua `SECRET_KEY` e `POSTGRES_PASSWORD` por valores próprios. No Compose, use senha compatível com URL ou faça o percent-encoding dos caracteres reservados na conexão.
3. Na raiz do repositório, rode:
```bash
docker-compose up -d --build
```
4. Acesse o frontend em `http://localhost:5173` e a API em `http://localhost:8000`. O backend aguarda o PostgreSQL e aplica as migrações versionadas. Este Compose é para desenvolvimento; detalhes em [README.docker.md](README.docker.md).

### Desenvolvimento local no Windows

Use Python 3.12 e Node 22.12 ou posterior. Primeiro copie `.env.example` para `.env` e substitua os valores de exemplo. O exemplo utiliza um SQLite novo; o `backend/db.sqlite3` legado é preservado porque seu histórico de migrações está inconsistente.

```powershell
cd backend
python -m venv venv_django
.\venv_django\Scripts\python.exe -m pip install -r requirements.txt
.\venv_django\Scripts\python.exe manage.py migrate
.\venv_django\Scripts\python.exe manage.py runserver 8000
```

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev
```

O script `start_fleetmonitor.bat` também valida o `.env`, instala dependências Python e aplica as migrações antes de iniciar os serviços. O simulador só envia dados quando `API_TOKEN` ou `SIMULATOR_USERNAME` e `SIMULATOR_PASSWORD` estão configurados para um usuário real da API. Sem `SECRET_KEY` estável, o modo de desenvolvimento gera uma chave por processo e tokens antigos deixam de valer após reiniciar.

### Validação

```powershell
cd frontend
npm run build
npm run lint
npm test
npm audit
```

```powershell
cd backend
.\venv_django\Scripts\python.exe manage.py check
.\venv_django\Scripts\python.exe manage.py makemigrations --check --dry-run
.\venv_django\Scripts\python.exe manage.py test core
```

Auditoria Python opcional: instale `pip-audit` no ambiente de desenvolvimento e execute `python -m pip_audit -r requirements.txt`.

---

## 📡 Endpoints e Rotas

Todas as rotas (exceto autenticação) fornecem controle completo (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) gerenciadas pelas ricas classes `ModelViewSet` do DRF. 

Abaixo documentamos as payloads aceitas e os respectivos endpoints.

### 🔐 Autenticação (`/auth/`)

Responsável pela gestão de tokens de acesso mediante criação de conta e login.

| Método | Endpoint | Descrição | Payload (JSON) |
| --- | --- | --- | --- |
| `POST` | `/auth/registrar/` | Cria um usuário. | `{"username": "johndoe", "email": "john@ex.com", "password": "123"}` |
| `POST` | `/auth/login/` | Autentica um usuário e retorna o *JWT Token*. | `{"username": "johndoe", "password": "123"}` |
| `POST` | `/auth/refresh/` | Atualiza o token expirado. | `{"refresh": "<refresh_token>"}` |


Todas as rotas de domínio abaixo exigem `Authorization: Bearer <access_token>`. O registro público valida a política de senha do Django e exige email; `cargo` e `is_active` são definidos pelo servidor. O login demo do frontend não emite JWT. A API ainda utiliza conjuntos globais de dados para usuários autenticados; não há autorização por conta implementada.

### 🚙 Veículos (`/veiculos/`)

Controle dos veículos registrados na frota.

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/veiculos/` | Lista todos os veículos. |
| `POST` | `/veiculos/` | Registra um veículo. Necessita de `placa`, `modelo`, `ano`, `status` (opcional). |
| `GET` | `/veiculos/<id>/` | Recupera detalhes de um veículo. |
| `PUT` | `/veiculos/<id>/` | Atualiza inteiramente o registro do veículo. |
| `DELETE`| `/veiculos/<id>/` | Exclui um veículo do sistema. |

### 👨‍✈️ Motoristas (`/motoristas/`)

Controle de condutores de veículos e score.

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/motoristas/` | Lista todos os motoristas. |
| `POST` | `/motoristas/` | Registra um motorista com `nome`, `cnh`, `pontuacao` (padrão 100.0). |
| `GET` | `/motoristas/<id>/` | Recupera detalhes de um motorista. |
| `PUT` | `/motoristas/<id>/` | Atualiza atributos ou CNH. |
| `DELETE`| `/motoristas/<id>/` | Exclui um motorista. |

### 🛰️ Posições IoT (`/posicoes/`)

Dados de telemetria enviados pelos rastreadores embarcados.

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/posicoes/` | Lista posições e indicadores mecânicos extraídos. |
| `POST` | `/posicoes/` | Registra `veiculo` (FK Id), `latitude`, `longitude`, `velocidade`, `consumo_combustivel` e `rpm`. |
| `GET` | `/posicoes/<id>/` | Dados espaciais específicos de um payload. |

O contrato existente de `/telemetria/` continua disponível para **consolidados diários**, com `veiculo`, `data` (`YYYY-MM-DD`), `combustivel_gasto`, `distancia_percorrida` e `velocidade_media`. Outros CRUDs disponíveis: `/contas/`, `/alertas-preditivos/`, `/ordens-servico/` e `/emissoes-esg/`.

### 🛠️ Manutenção (`/manutencoes/`)

Histórico de custos laborais e ordens de serviço.

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/manutencoes/` | Lista incidentes mecânicos logados. |
| `POST` | `/manutencoes/` | Arquiva manutenção enviando `veiculo`, `tipo` (preventiva/corretiva), `custo`, `descricao`. |
| `GET` | `/manutencoes/<id>/` | Traz informações em detalhes do incidente. |
| `PUT` | `/manutencoes/<id>/` | Corrigi laudo ou custo modificado. |
| `DELETE`| `/manutencoes/<id>/` | Remove a manutenção (estorno/erro). |

---

## ⚙️ Estrutura de Diretórios Django

- `backend/fleet_monitor/`: Núcleo de configurações do projeto Django (`settings.py`, `urls.py`).
- `backend/core/`: O *App* principal com nossos modelos de Entidades (`models.py`), as Views DRF (`views.py` e `urls.py`) e regras de transformação (`serializers.py`).
