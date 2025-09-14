# Barfield Bid Tracker

Full‑stack app for managing construction bids for **Barfield Fence & Fabrication**.

- **Server**: Node + Express + Prisma (SQLite for local; Postgres for prod)
- **Client**: React + Vite + Tailwind + Recharts
- **Charts**: Dynamic range (12 / 11 / 10 / … months)
- **Features**: Dashboard metrics & charts, Bids (list/details/edit/import/export), Companies (projects + totals), Contacts (CRUD), Add New Bid, CSV import template, search/filters, tags, notes, attachments, soft archive.

> Local-first: SQLite DB with seed data. Docker Compose included for Postgres deploys (e.g., DigitalOcean).

---

## Quick Start (Local Dev)

### 1) Install dependencies
```bash
# from project root
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2) Initialize database (SQLite) and seed
```bash
cd server
# Generate Prisma client & create DB
npx prisma generate
npx prisma migrate dev --name init
# Seed demo data
npm run seed
# start API
npm run dev
```

### 3) Start the web client
```bash
cd ../client
npm run dev
# open http://localhost:5173
```

Server runs on http://localhost:4000, client on http://localhost:5173

---

## Deploy with Docker (e.g., DigitalOcean Droplet)

1. Ensure `server/prisma/schema.prisma` provider is `postgresql` and comment out the SQLite block.
2. `DATABASE_URL` is set in `docker-compose.yml` to point to the `db` service; update if needed.
3. Build & run:
```bash
docker compose up -d --build
```
4. Run migrations inside server container:
```bash
docker compose exec server npx prisma migrate deploy
```
5. (Optional) Seed prod data:
```bash
docker compose exec server npm run seed
```

---

## CSV Import Template

Use **client/public/import_template.csv**. Each row = 1 scope.
Columns:
- `projectName, clientCompany, contactName, proposalDate, dueDate, jobLocation, leadSource, bidStatus, scopeName, scopeCost, scopeStatus`

The importer groups rows by `projectName` + `clientCompany` (and creates the bid & scopes).

---

## Scripts

### Server
- `npm run dev` – start TS dev server (nodemon)
- `npm run build` – compile to JS
- `npm start` – run compiled server
- `npm run seed` – seed demo data

### Client
- `npm run dev` – Vite dev
- `npm run build` – production build
- `npm run preview` – preview prod build

---

## Notes
- **Active Pipeline Value** = sum of **Pending** scope costs (non-archived bids).
- **Total Value Won (Active Bids)** = sum of **Won** scope costs where **Bid Status = Active**.
- **Win/Loss Ratio (Active)** = wonScopes / lostScopes across **Active** bids.
- **Aggregate Scope Status (per bid)**: if any Pending → `Pending`; else if any Lost → `Lost`; else if any Won → `Won`; else `Unknown`.
