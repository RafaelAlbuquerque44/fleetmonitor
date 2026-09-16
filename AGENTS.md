# AGENTS.md — Regras e Diretrizes para Agentes de IA

Este documento define a arquitetura, convenções, padrões de código e diretrizes operacionais que todos os agentes de IA devem seguir ao trabalhar no repositório **FleetMonitor**.

---

## 1. Visão Geral do Projeto

O **FleetMonitor** é uma solução completa de monitoramento e gestão inteligente de frotas veiculares, integrando telemetria IoT em tempo real, gestão de motoristas, controle de manutenções preventivas e corretivas, análise financeira de custos operacionais e relatórios executivos/ESG (emissões de CO2).

### Principais Pilares:
- **Gestão de Ativos e Condutores**: Cadastro e auditoria de veículos e motoristas (CNH, status, score).
- **Telemetria IoT & Rastreamento**: Monitoramento espacial (latitude/longitude), velocidade, RPM e consumo em tempo real.
- **Manutenção Inteligente**: Histórico de ordens de serviço, custos e diagnóstico assistido por IA.
- **Painel Financeiro & ESG**: Apuração de despesas (combustível, oficina), receitas e indicadores de sustentabilidade.
- **Multi-Tenant / Contas**: Suporte a múltiplas contas/clientes com isolamento contextual e controle modular de produtos (`produto_manutencao`, `produto_financeiro`, `produto_ia_assistente`, `produto_roteirizacao`, `produto_telemetria`).

---

## 2. Estrutura de Diretórios e Tecnologias

```
fleetmonitor/
├── backend/                  # API REST em Django + DRF
│   ├── core/                 # Aplicação principal (models, views, serializers, urls)
│   ├── fleet_monitor/        # Configurações do projeto Django (settings, urls, wsgi)
│   ├── Dockerfile            # Imagem do container backend
│   ├── requirements.txt      # Dependências Python
│   └── simulator.py          # Script simulador de envio de telemetria IoT
├── frontend/                 # Aplicação SPA em React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis (TopBar, AIChat, Background, etc.)
│   │   ├── contexts/         # Contextos globais (AuthContext, ThemeContext)
│   │   ├── layouts/          # Layouts de rota (MainLayout com Sidebar, AuthLayout)
│   │   ├── lib/              # Contextos de domínio (VehicleContext, DriverContext, AccountContext) e utils
│   │   ├── pages/            # Páginas da aplicação (Dashboard, Vehicles, Drivers, Tracking, etc.)
│   │   └── index.css         # Configuração de temas e tokens Tailwind CSS v4
│   ├── package.json          # Dependências Node.js
│   └── vite.config.ts        # Configuração do bundler Vite
├── docker-compose.yml        # Orquestração de PostgreSQL, Backend e Frontend
├── start_ecofleet.bat        # Script de inicialização automática local no Windows
└── README.md                 # Documentação geral do repositório
```

---

## 3. Diretrizes de Arquitetura e Engenharia

### 3.1. Backend (Python / Django 5.x / Django REST Framework)

1. **Modelos e Migrações**:
   - Toda alteração em `backend/core/models.py` **deve obrigatoriamente** ser acompanhada da criação e execução de migrações (`python manage.py makemigrations core && python manage.py migrate`).
   - Mantenha chaves estrangeiras com `on_delete` explícito e coerente (`SET_NULL`, `CASCADE`, `PROTECT`).
   - Mantenha nomes de campos no banco de dados em `snake_case`.

2. **Endpoints e Serializers**:
   - Utilize a estrutura de `ModelViewSet` do DRF registrada no `DefaultRouter` em `backend/core/urls.py` para operações CRUD padronizadas.
   - Ao criar ou modificar serializers em `backend/core/serializers.py`, garanta validação explícita de campos obrigatórios e sanitização de payloads.
   - Respostas de API devem seguir os códigos de status HTTP corretos (`200 OK`, `201 CREATED`, `400 BAD REQUEST`, `401 UNAUTHORIZED`, `404 NOT FOUND`).

3. **Autenticação e Permissões**:
   - Autenticação baseada em JWT com `rest_framework_simplejwt`.
   - O modelo de usuário customizado é `Usuario` (`AUTH_USER_MODEL = 'core.Usuario'`), herdando de `AbstractUser` e com campo de perfil `cargo`.
   - Endpoints públicos devem possuir permissão explícita (`@permission_classes([permissions.AllowAny])`), e endpoints restritos devem requerer token de autorização (`Bearer <token>`).

4. **Simulador de Telemetria**:
   - Ao alterar as rotas ou payloads de veículos e telemetria, verifique a compatibilidade com `backend/simulator.py`.

---

### 3.2. Frontend (React 19 / TypeScript / Tailwind CSS v4 / Vite)

1. **Tipagem Estrita (TypeScript)**:
   - Não utilize `any` arbitrário. Defina interfaces claras para todas as entidades (`Vehicle`, `Driver`, `Conta`, `TelemetryPayload`, etc.).
   - Mantenha coerência entre os tipos do TypeScript e os campos retornados pelos serializers do Django.

2. **Design System e Estilo Visual**:
   - O projeto utiliza **Tailwind CSS v4** com paleta corporativa definida em `src/index.css` através dos tokens `--color-fleet-50` até `--color-fleet-900`.
   - Suporte rigoroso a **Modo Escuro (Dark Mode)** e **Modo Claro (Light Mode)**. Toda alteração visual deve funcionar perfeitamente em ambos os temas utilizando variantes como `dark:bg-fleet-900`, `dark:text-white`, `border-gray-200 dark:border-white/10`.
   - Manter alto padrão visual (glassmorphism, microanimações com `framer-motion`, ícones do `lucide-react`, gráficos responsivos com `recharts`).
   - Para mapas, utilizar o ecossistema `leaflet` e `react-leaflet`.

3. **Gerenciamento de Estado e Multi-Tenant**:
   - As regras de negócio de veículos, motoristas e contas residem nos contextos em `src/lib/` (`VehicleContext`, `DriverContext`, `AccountContext`).
   - O sistema possui suporte a **Multi-Contas**:
     - Dados no `localStorage` devem ser isolados por conta ativa (ex: `ecoFleet_vehicles_${activeAccountId}`).
     - A conta com ID `999999` representa o `Admin Global (Demo)`. Nunca remova a injeção do mock da conta demo, pois ela garante a demonstração funcional imediata sem dependência estrita de backend ativo.
   - Ao integrar chamadas HTTP via `axios`, garanta tratamento gracioso de falha (fallback ou notificação de erro sem travar a renderização da tela).

4. **Roteamento e Proteção**:
   - O roteamento é controlado pelo `react-router-dom` em `src/App.tsx`.
   - Novas páginas operacionais devem ser incluídas dentro de `<ProtectedRoute><MainLayout /></ProtectedRoute>`.
   - Páginas de autenticação ficam agrupadas sob `<AuthLayout />`.

---

## 4. Segurança e Boas Práticas

- **Segredos e Credenciais**: Nunca exponha credenciais, senhas de banco ou chaves de API (como chaves do Google Gemini) no código rastreado pelo Git. Utilize variáveis de ambiente (`.env` ou configurações de container).
- **CORS e Hosts**: Mantenha as configurações de `CORS_ALLOW_ALL_ORIGINS` e `ALLOWED_HOSTS` conscientes de ambiente de desenvolvimento vs. produção.
- **Integridade de Código Existente**: Não remova funcionalidades existentes, comentários técnicos essenciais ou scripts operacionais (`start_ecofleet.bat`, `fix-theme.js`, etc.) sem justificativa e consentimento explícito.

---

## 5. Comandos de Desenvolvimento e Validação

Ao testar ou orientar a execução da aplicação, utilize os seguintes comandos:

### Backend
```bash
# Navegar até a pasta backend
cd backend

# Criar ambiente virtual e instalar dependências
python -m venv venv_django
venv_django\Scripts\activate
pip install -r requirements.txt

# Executar migrações
python manage.py makemigrations
python manage.py migrate

# Iniciar servidor da API
python manage.py runserver 8000

# Executar o simulador de telemetria
python simulator.py
```

### Frontend
```bash
# Navegar até a pasta frontend
cd frontend

# Instalação de dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Verificação de tipos e build de produção
npm run build

# Validação com linter
npm run lint
```

### Docker
```bash
# Subir todo o ecossistema (PostgreSQL, Django e Vite)
docker-compose up -d --build

# Parar os serviços
docker-compose down
```

---

## 6. Checklist Obrigatório para Agentes de IA

Ao receber uma tarefa no projeto FleetMonitor, o agente deve:
1. **Compreender o Escopo**: Identificar se a modificação afeta o Backend, o Frontend ou a camada de comunicação entre ambos.
2. **Respeitar o Padrão do Módulo**: Se for uma nova entidade de frota, criar o Modelo Django, registrar no Admin/Router, criar o Serializer e atualizar os Tipos/Contextos do Frontend.
3. **Garantir a Paridade de Temas**: Validar se qualquer nova tela ou componente suporta tanto o tema escuro (`dark`) quanto o tema claro (`light`).
4. **Preservar a Conta Demo**: Assegurar que os fluxos funcionem tanto para usuários autenticados reais quanto para o ambiente de demonstração (`Admin Global`).
5. **Validar a Construção**: Garantir que o código TypeScript compila sem erros (`npm run build` ou validação do `tsc`).
