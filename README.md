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

2. Edit `.env.local` and add any required variables as they are introduced in later stories. The baseline setup has no required env vars.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Script       | Description                |
| ------------ | -------------------------- |
| `pnpm dev`   | Start development server   |
| `pnpm build` | Create production build    |
| `pnpm start` | Start production server    |
| `pnpm lint`  | Run ESLint                 |

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
