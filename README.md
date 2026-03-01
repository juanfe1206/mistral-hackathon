# Mistral Lead Ops

Lead operations platform built with Next.js.

## Prerequisites

- **Node.js** 20.x or later (LTS recommended)
- **pnpm** (required; architecture specifies pnpm as package manager)

## Environment Setup

1. Copy the example environment file:

   ```bash
   # Linux/macOS
   cp .env.example .env.local

   # Windows (PowerShell)
   Copy-Item .env.example .env.local
   ```

2. Edit `.env.local` and set `DATABASE_URL` to your PostgreSQL connection string. For MVP without real data, the `.env.example` already includes mock values for `WHATSAPP_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET`.

## Database & Mock Data (MVP)

If you have no real WhatsApp data, seed the database with mock leads:

```bash
# 1. Run migrations (requires PostgreSQL running)
pnpm db:migrate

# 2. Seed mock leads for demo
pnpm db:seed

# 3. Start dev server
pnpm dev
```

Then open [http://localhost:3000/triage](http://localhost:3000/triage) to see the triage queue with sample leads.

**No PostgreSQL?** Use a free tier: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app). Copy the connection string to `DATABASE_URL`.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Script         | Description                    |
| -------------- | ------------------------------ |
| `pnpm dev`     | Start development server       |
| `pnpm build`   | Create production build        |
| `pnpm start`   | Start production server        |
| `pnpm lint`    | Run ESLint                     |
| `pnpm db:migrate` | Run database migrations     |
| `pnpm db:seed`   | Seed mock leads (for MVP demo) |

## Project Structure

```
src/
├── app/           # Next.js App Router (pages, layout)
├── config/       # Configuration (minimal for baseline)
├── lib/          # Shared utilities (minimal for baseline)
└── styles/       # Theme tokens (MUI in later stories)
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Project Architecture](_bmad-output/planning-artifacts/architecture.md)
