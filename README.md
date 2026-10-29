# TaskFlow — Complete Full-Stack Application

A responsive task management application built with Next.js, React, TypeScript, Tailwind CSS, Express, Zod, PostgreSQL, and Docker Compose.

## Included

- Responsive amber / black / white dashboard
- Create, edit, complete/reopen, search, filter, and delete tasks
- PostgreSQL persistence and indexes
- API input validation and parameterized SQL queries
- Loading, retry, error, success-notification, and delete-confirmation UX
- Health and readiness endpoints
- Docker Compose stack for web, API, and PostgreSQL

## Fastest start (Docker)

Prerequisite: Docker Desktop installed and running.

```bash
# From the taskflow-complete directory
cp .env.example .env
# Optional but recommended: edit .env and set a unique POSTGRES_PASSWORD
docker compose up --build -d
```

Open **http://localhost:3001**.

Check services:

```bash
docker compose ps
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/api/tasks
```

View logs:

```bash
docker compose logs -f web api db
```

Stop services (database data is retained):

```bash
docker compose down
```

Stop and delete the database volume (destructive — removes saved tasks):

```bash
docker compose down -v
```

## Local development without Docker

You need Node.js 20.9+ and PostgreSQL 16+.

1. Create a database named `taskflow` and run `database/init/001_schema.sql` against it.
2. Start the API:

```bash
cd api
cp .env.example .env
# Edit DATABASE_URL if your local PostgreSQL credentials differ
npm install
npm run dev
```

3. In another terminal, start the web app:

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

The web app runs on port 3001 and proxies `/api/backend/*` to the API at port 3000.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Process health |
| GET | `/ready` | API and database readiness |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update title, description, or completion |
| DELETE | `/api/tasks/:id` | Delete task |

Successful collection/item responses use `{ "data": ... }`; errors use `{ "error": "..." }`. Task IDs are serialized as strings to avoid JavaScript integer precision issues.

## Production notes

This is a complete runnable starter application, not a fully hardened multi-user SaaS. Before public production deployment, add authentication and per-user authorization, secret management, HTTPS, database backups/migrations, rate limiting, structured logging, and a production-specific CORS policy. Do not expose PostgreSQL publicly in production. Change the default local database password.
