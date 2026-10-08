# FleetMonitor frontend

React 19, TypeScript estrito, Vite 7 e Tailwind CSS v4. Temas claro e escuro, mapas Leaflet e gráficos Recharts.

Use Node 22.12 ou posterior:

```powershell
npm ci
npm run dev
npm run build
npm run lint
npm test
```

Acesse `http://localhost:5173`. O login `admin / admin` habilita a demonstração local. A conta Admin Global (ID `999999`) recebe dados iniciais; outras contas começam vazias. Os dados são persistidos por conta no navegador e ainda não são integrados à API Django.

- `src/App.tsx`: rotas protegidas, imports sob demanda e providers operacionais.
- `src/lib/`: contextos de contas, veículos e motoristas; persistência e regras de módulos.
- `src/contexts/`: sessão demo e tema.
- `src/index.css`: tokens Tailwind v4 e variante dark. Não há configuração Tailwind v3 ativa.
- `src/pages/`: páginas e integrações públicas IBGE, Nominatim e OSRM.

Os testes usam Vitest/jsdom e React StrictMode para validar isolamento de contas, preservação da demo, exclusões, temporizadores e recuperação do armazenamento.

Consulte [a documentação principal](../README.md) e [a revisão de arquitetura](../docs/architecture-review.md) para execução do backend e pendências de integração/autorização.
