# FleetMonitor API

Bem-vindo à documentação do **FleetMonitor API**. Esta aplicação foi feita em Django REST Framework, a fim de fornecer uma estrutura mais escalável acompanhada das ricas baterias inclusas do ecossistema Django.

## Tecnologias Utilizadas

- **Django**: Família 5.x
- **Django REST Framework (DRF)**: Construção rápida de APIs.
- **PostgreSQL**: Banco de dados relacional.
- **Simple JWT**: Autenticação nativa baseada em Token JWT.
- **Docker**: Containerização completa da solução.

---

## 🚀 Como Executar Localmente

### Usando Docker (Recomendado)

1. Certifique-se de que tenha o **Docker** e o **Docker Compose** instalados na sua máquina.
2. Na raiz do repositório, rode:
```bash
docker-compose up -d --build
```
3. O servidor backend iniciará automaticamente, as migrações serão refletidas no PostgreSQL e ele ficará acessível em:
   `http://localhost:8000`

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


Atenção as rotas abaixo podem requerer cabeçalho de Autenticação (`Authorization: Bearer <access_token>`).

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

### 🛰️ Telemetria (`/telemetria/`)

Dados de telemetria enviados pelos rastreadores embarcados.

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/telemetria/` | Lista posições e indicadores mecânicos extraídos. |
| `POST` | `/telemetria/` | Registra metadados contendo `veiculo` (FK Id), `latitude/longitude`, `velocidade`, `consumo_combustivel` e `rpm`. |
| `GET` | `/telemetria/<id>/` | Dados espaciais específicos de um payload. |

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
