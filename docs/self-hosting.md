# Self-hosting the Creative Media Analyser

Six steps from zero to a running instance. Each step should take a few minutes.

## 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) and create a new project. Pick any region; the tool is not latency-sensitive. Once the project is ready, go to **Settings > API** and note down:

- **Project URL** (e.g. `https://abcdefghij.supabase.co`)
- **anon public key**
- **service_role secret key**

## 2. Create the storage bucket

In the Supabase dashboard, go to **Storage** and create a new bucket called `creatives`. Set it to **public** (the app constructs public URLs to display images in the browser). If you ran `schema.sql` and it included the bucket creation, this step is already done.

## 3. Run the schema

Open the **SQL Editor** in your Supabase dashboard, paste the contents of [`supabase/schema.sql`](../supabase/schema.sql), and run it. This creates all nine tables, indexes, and row-level security policies. The schema is reconstructed from the TypeScript types in the codebase; if anything is missing, open an issue on the repo.

<details>
<summary>What the nine tables are</summary>

| Table | Purpose |
|---|---|
| `projects` | Project metadata (brand, category, KPI, audience) |
| `creatives` | Uploaded creative images (filename, storage path, dimensions) |
| `performance_uploads` | CSV upload records (filename, row count, validation) |
| `performance_rows` | Individual performance data rows from CSV imports |
| `creative_mappings` | Links between creatives and their performance rows |
| `variable_schemas` | Variable definitions for AI extraction |
| `analysis_runs` | Extraction run tracking (progress, token usage, cost) |
| `extraction_results` | Per-creative AI extraction output |
| `insights` | Generated insights and recommendations |

</details>

## 4. Get an Anthropic API key

Sign up at [console.anthropic.com](https://console.anthropic.com), create an API key, and add credit. The tool uses Claude Haiku 4.5 for image analysis. See the cost transparency section in the README for per-creative pricing.

## 5. Configure environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## 6. Run it

**Local development:**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Production (Vercel):**

Click the Deploy to Vercel button in the README. Vercel will prompt you for the four environment variables during setup. The Supabase database setup (steps 1 to 3) still needs to be done separately.
