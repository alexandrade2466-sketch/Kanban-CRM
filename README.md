# Kanban CRM

React + Vite Kanban CRM connected to Supabase. Displays pipelines, stages, and deals in a column layout.

## Setup

1. **Install dependencies**

   ```bash
   cd kanban-crm
   npm install
   ```

2. **Environment**

   `.env` is already configured with:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Supabase schema**

   Run `supabase-setup.sql` in your Supabase SQL Editor (Dashboard → SQL Editor → New query). This creates the tables and Row Level Security policies.

## Run

```bash
npm run dev
```

Open the URL shown (e.g. http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Features

- **Create pipelines & stages in the UI** — No Supabase setup needed for content. Click "Manage Pipelines" to create pipelines and add stages.
- Pipelines, stages, and deals from Supabase
- Stages shown as columns; deals as cards inside each stage
- Deal count and total value per stage
- Pipeline switcher when multiple pipelines exist
- Import deals from CSV
- Styling with Tailwind CSS
