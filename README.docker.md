# FleetMonitor — Docker development

This repository includes Dockerfiles and a docker-compose configuration to run the Django backend and the Vite frontend for development.

Services:
- `backend` — Django development server on port `8000`.
- `frontend` — Vite dev server on port `5173`.

Copy `.env.example` to `.env` at the repository root and replace the secret key and database password before starting. The Compose database URL expects a URL-compatible password; percent-encode reserved characters when using a custom connection URL.

Quick start:

```bash
# from repository root
docker compose up -d --build

# view logs
docker compose logs -f
```

Stop containers while preserving the PostgreSQL volume:

```bash
docker compose down
```

Notes:
- Compose uses PostgreSQL 15 with the named `postgres_data` volume. The root `.env` SQLite URL applies only to local execution; Compose overrides it.
- The backend waits for the PostgreSQL healthcheck and applies committed migrations. Generate new migrations during development and commit them with model changes.
- The frontend image uses Node 22 and `npm ci`; local dependencies, environment files and database files are excluded from build contexts.
- The compose setup mounts the local `backend` and `frontend` folders into the containers for live development.
- Rebuild after changing `requirements.txt` or the npm lockfile.
- The frontend login is a local demo. It does not authenticate against the API; consult [the architecture review](docs/architecture-review.md) before production use.
