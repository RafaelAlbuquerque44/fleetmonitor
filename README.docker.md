# FleetMonitor — Docker development

This repository includes Dockerfiles and a docker-compose configuration to run the Django backend and the Vite frontend for development.

Services:
- `backend` — Django development server on port `8000`.
- `frontend` — Vite dev server on port `5173`.

Quick start (after removing any old containers you no longer need):

```bash
# from repository root
docker compose pull || true
docker compose up -d --build

# view logs
docker compose logs -f
```

Stop and remove containers:

```bash
docker compose down --rmi local --volumes
```

Notes:
- The backend uses a local SQLite database file `backend/db.sqlite3` which is persisted in the project folder.
- The compose setup mounts the local `backend` and `frontend` folders into the containers for live development.
- If you have a custom `requirements.txt`, replace the provided `backend/requirements.txt` accordingly and rebuild.
