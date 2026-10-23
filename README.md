# DevForge

DevForge is a full-stack developer workspace built with React and TypeScript, Java 21 and Spring Boot. H2 is used for the default local setup, and PostgreSQL is available for local or hosted deployments.

## Current Features

- Create, view, edit, and delete projects.
- Create and manage tasks within a selected project.
- Organize tasks into To do, In progress, and Done columns.
- Change task status by dragging a card or using its status selector.
- Set task priority to Low, Medium, or High.
- Save, edit, search, and delete code snippets in Monaco Editor.
- Enable or disable an unlisted share link for a snippet.
- Create collections and organize small text source files inside them.
- Edit source files in Monaco Editor, search by file name, and copy file contents.
- Keep H2 data locally in `backend/data/` across app restarts when using the default setup.
- Run against PostgreSQL using the optional `postgres` Spring profile.

Shared links are accessible to anyone who has the link. DevForge does not have accounts or access permissions yet, so do not share sensitive code.

Source files are plain text stored in the local database. They are limited to 30,000 characters each and are not compiled or executed by DevForge.

## API

Projects use `/api/projects`:

- `GET /api/projects` - list projects
- `POST /api/projects` - create a project
- `PUT /api/projects/{id}` - update a project
- `DELETE /api/projects/{id}` - delete a project and its tasks

Tasks use `/api/tasks`:

- `GET /api/tasks?projectId={id}` - list tasks for one project
- `POST /api/tasks` - create a task
- `PUT /api/tasks/{id}` - update a task, including its status
- `DELETE /api/tasks/{id}` - delete a task

Snippets use `/api/snippets`:

- `GET /api/snippets?query={text}` - list or search snippets
- `POST /api/snippets` - create a snippet
- `PUT /api/snippets/{id}` - update a snippet
- `DELETE /api/snippets/{id}` - delete a snippet
- `POST /api/snippets/{id}/share` - enable a share link
- `DELETE /api/snippets/{id}/share` - disable a share link
- `GET /api/snippets/shared/{shareId}` - view a shared snippet

Collections and source files use `/api/collections` and `/api/source-files`:

- `GET /api/collections` - list collections
- `POST /api/collections` - create a collection
- `PUT /api/collections/{id}` - update a collection
- `DELETE /api/collections/{id}` - delete a collection and its files
- `GET /api/collections/{id}/files` - list files in one collection
- `POST /api/collections/{id}/files` - create a file in a collection
- `PUT /api/source-files/{id}` - update a file
- `DELETE /api/source-files/{id}` - delete a file

## Requirements

- Java 21 or newer
- Node.js and npm
- Docker Desktop (optional, only if you want the local PostgreSQL setup below)

Maven does not need to be installed globally; the backend includes the Maven Wrapper.

## Verify Changes

From `backend/`, run the automated API and read-only demo tests:

```powershell
.\mvnw.cmd verify
```

From `frontend/`, install the exact dependency versions and check the UI:

```powershell
npm ci
npm run lint
npm run build
```

GitHub Actions runs these same backend and frontend checks for pushes and pull requests.

## Run The Backend

Open a terminal in `backend/` and run:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend starts on `http://localhost:8080`. By default, it uses H2 and stores data in `backend/data/`.

## Run With Local PostgreSQL (Optional)

Install and open Docker Desktop, then in the project root run:

```powershell
docker compose up -d postgres
```

In the backend terminal, activate the PostgreSQL profile before starting Spring Boot:

```powershell
$env:SPRING_PROFILES_ACTIVE = "postgres"
.\mvnw.cmd spring-boot:run
```

The first command starts a local PostgreSQL database in Docker. Its data is kept in a Docker volume across restarts. The second tells Spring Boot to use PostgreSQL instead of H2. To go back to H2, stop the backend, clear the profile variable in that terminal, and start it again:

```powershell
Remove-Item Env:SPRING_PROFILES_ACTIVE -ErrorAction SilentlyContinue
.\mvnw.cmd spring-boot:run
```

The local Compose password is only for development. Do not reuse it for a public deployment. For a hosted PostgreSQL database, configure `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` as private environment variables in the hosting dashboard. For Supabase, use the session pooler connection details when the host only supports IPv4, and require SSL in the URL with `?sslmode=require`.

H2 data and PostgreSQL data are separate. Existing local H2 projects, tasks, snippets, and files are not automatically copied into PostgreSQL.

## Run The Frontend

Open a second terminal in `frontend/` and run:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`. Requests under `/api` are forwarded to the backend on port 8080.

## Public Read-Only Demo

The `demo` Spring profile seeds a small sample workspace only when its database is completely empty. It also blocks API `POST`, `PUT`, `PATCH`, and `DELETE` requests with HTTP 403. The frontend can hide editing controls with `VITE_DEMO_MODE=true`.

For local exploration, start the backend with a separate, empty database and both profiles enabled. In PowerShell, for an H2 demo database:

```powershell
$env:SPRING_PROFILES_ACTIVE = "demo"
$env:SPRING_DATASOURCE_URL = "jdbc:h2:file:./data/devforge-demo;DB_CLOSE_ON_EXIT=FALSE"
.\mvnw.cmd spring-boot:run
```

In `frontend/.env.local`, set `VITE_DEMO_MODE=true` and `VITE_API_BASE_URL` to the backend URL, then restart Vite. `.env.local` is ignored by Git. To return to the ordinary writable local app, remove those environment overrides and restart both servers.

For hosting, use a **new, dedicated database containing no personal data** for the public demo. Configure the backend with `SPRING_PROFILES_ACTIVE=postgres,demo`, database credentials as private host environment variables, and `APP_CORS_ALLOWED_ORIGIN` set to the exact public frontend URL. Set `VITE_DEMO_MODE=true` and `VITE_API_BASE_URL` to the deployed backend URL before building the frontend. Do not point the demo at your personal development database: read-only blocks API writes, but it does not hide data already in that database. Demo mode is public and read-only; account creation and login are disabled there.

`GET /api/status` reports whether the backend is reachable and whether its demo profile is read-only.

## Next Features

## Accounts And Private Workspaces

Outside the `demo` profile, DevForge supports email/password signup and login using BCrypt password hashes, server-side sessions, CSRF tokens, and per-account ownership for projects, tasks, snippets, collections, and source files. A first account on an existing local database claims records that do not yet have an owner; later accounts start with an empty private workspace. Publicly shared snippets remain readable through their share links.

For a hosted private instance, configure a persistent PostgreSQL database, set `APP_CORS_ALLOWED_ORIGIN` to the exact frontend origin, and set `DEVFORGE_SESSION_COOKIE_SECURE=true`. The cookie is HttpOnly and the API uses CSRF protection. Keep `DEVFORGE_SESSION_COOKIE_SAME_SITE=lax` when frontend and API are same-site. Only use `none` when they are hosted on different sites, and only over HTTPS. A public portfolio demo should continue using the separate `demo` profile and a separate database.

Hosting accounts and provider-specific deployment settings still need to be configured by you; CI passing does not itself deploy the app.

## Deploy a Single-Origin Render App

The root `Dockerfile` builds the React frontend and packages it into the Spring Boot application. This serves the UI and `/api` from one origin, which keeps the session cookie first-party. `render.yaml` configures a free Render web service and prompts for the external PostgreSQL connection values; no database passwords belong in Git.

Create a PostgreSQL database first, then create a Render Blueprint from this GitHub repository. For a Supabase database, use its session pooler connection details if needed and include `?sslmode=require` in `SPRING_DATASOURCE_URL`. Enter the JDBC URL, username, and password only in Render's secure Blueprint prompts. Set `APP_CORS_ALLOWED_ORIGIN` in the service environment to the exact Render app URL after it is created. The app uses a dedicated database; never connect a public deployment to a personal database.

Render's free web services sleep when idle. Free Render Postgres expires after 30 days, so use a separate PostgreSQL provider or a paid Render database if you need the database to remain available past that period. Free Supabase databases can pause after a week of low activity; resume them from the Supabase dashboard if that happens.
