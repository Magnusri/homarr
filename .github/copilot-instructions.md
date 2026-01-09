# Homarr Copilot Coding Agent Instructions

## Project Overview

Homarr is a highly customizable dashboard and homepage application for self-hosted services. It's a full-stack TypeScript application built with Next.js 16, featuring real-time updates via WebSockets and Redis, extensive integrations with popular self-hosted applications, and a modular architecture using a pnpm workspace monorepo structure with Turborepo.

**Technology Stack:**
- **Runtime:** Node.js 24.12.0 (required - enforced by engines field)
- **Package Manager:** pnpm 10.27.0 (required - enforced by engines field)
- **Build Tool:** Turborepo with custom turbo.json configuration
- **Framework:** Next.js 16.1.1 with React 19.2.3
- **Database:** Drizzle ORM supporting SQLite (better-sqlite3), MySQL (mysql2), PostgreSQL (node-postgres)
- **UI:** Mantine 8.3.10 with custom theming
- **Testing:** Vitest with @vitest/ui and coverage via v8
- **Linting:** ESLint 9.x with flat config
- **Formatting:** Prettier 3.x
- **Type Checking:** TypeScript 5.9.3

**Repository Structure:**
- `apps/` - Main applications: `nextjs` (Next.js frontend), `tasks` (cron job service), `websocket` (WebSocket server)
- `packages/` - 34+ shared workspace packages (api, auth, db, integrations, ui, widgets, etc.)
- `tooling/` - Shared tooling configs (eslint, prettier, typescript, github actions)
- `e2e/` - End-to-end tests using Playwright
- `scripts/` - Utility scripts for deployment and automation
- `static-data/` - Static assets and data files

## Critical Environment Setup

### Prerequisites
**You MUST use the exact versions specified:**
1. **Node.js 24.12.0** - Use nvm: `nvm install 24.12.0 && nvm use 24.12.0`
2. **pnpm 10.27.0** - Install globally: `npm install -g pnpm@10.27.0`
3. **Environment file** - Always copy `.env.example` to `.env` before any operations

### Initial Setup Commands
```bash
# 1. Set Node version (REQUIRED)
nvm use 24.12.0  # Or install with: nvm install 24.12.0

# 2. Install pnpm globally if needed
npm install -g pnpm@10.27.0

# 3. Copy environment file (REQUIRED before install/build/test)
cp .env.example .env

# 4. Install dependencies
pnpm install --frozen-lockfile
```

**Important Notes:**
- Some native dependencies (`cpu-features`, `ssh2`) may fail to compile with Node 24.12.0 due to nan compatibility issues. These failures are NON-CRITICAL - the application still functions.
- The `packages/definitions` postinstall script may fail if `homarr.dev` is unreachable. This is also NON-CRITICAL.
- If you encounter native build failures, use `pnpm install --frozen-lockfile --ignore-scripts` to skip build scripts.

## Build, Test, and Validation Commands

### Standard Development Workflow

**1. Linting (Run time: ~30-60 seconds)**
```bash
pnpm lint          # Check for linting errors across all packages
pnpm lint:fix      # Auto-fix linting issues
pnpm lint:ws       # Check workspace dependencies with sherif
```

**2. Formatting (Run time: ~20-40 seconds)**
```bash
pnpm format        # Check code formatting
pnpm format:fix    # Auto-fix formatting issues
```

**3. Type Checking (Run time: ~60-180 seconds)**
```bash
pnpm typecheck     # Type check all packages (can be slow, ~2-3 minutes)
turbo typecheck    # Alternative using turbo directly
```

**4. Testing (Run time: ~30-90 seconds)**
```bash
pnpm test          # Run unit tests with coverage
pnpm test:ui       # Run tests with Vitest UI
pnpm test:e2e      # Run end-to-end tests (requires Docker image)
```

**5. Building (Run time: ~2-5 minutes)**
```bash
# ALWAYS copy .env.example to .env before building
cp .env.example .env

# Build all packages
pnpm build         # Uses turbo to build all workspace packages

# Clean build artifacts
pnpm clean:workspaces  # Clean turbo cache
pnpm clean             # Clean node_modules (requires reinstall after)
```

**6. Development Server**
```bash
pnpm dev           # Start all dev servers in parallel (nextjs, tasks, websocket)
```

**7. Production Start**
```bash
pnpm start         # Start production servers (requires prior build)
```

### GitHub Actions CI/CD Workflow

The repository uses several CI workflows in `.github/workflows/`:

**code-quality.yml** (Runs on PR and push to main):
- **lint:** `pnpm lint && pnpm lint:ws` (10min timeout)
- **format:** `pnpm format` (10min timeout)
- **typecheck:** `turbo typecheck` (10min timeout)
- **test:** `pnpm test` (10min timeout)
- **e2e:** Builds Docker image, installs Playwright, runs `pnpm test:e2e` (15min timeout)
- **build:** `pnpm build` (10min timeout)

**Setup Action** (`.github/tooling/github/setup/action.yml`):
```yaml
- uses: pnpm/action-setup@v4
- uses: actions/setup-node@v6 with node-version: 24.12.0 cache: "pnpm"
- pnpm add -g turbo
- pnpm install --frozen-lockfile
```

**Common CI Requirements:**
- Always run `cp .env.example .env` before build/lint/test
- Use `--frozen-lockfile` with pnpm install
- Set `CI=true` environment variable for builds: `cross-env CI=true turbo build`
- E2E tests require building Docker image first

## Known Issues and Workarounds

### 1. Native Dependency Build Failures (cpu-features, ssh2)
**Issue:** These packages fail to compile with Node.js 24.12.0 due to nan compatibility issues.
**Workaround:** These are optional or have fallbacks. Failures can be ignored. Use `pnpm install --ignore-scripts` if needed.

### 2. Environment Variables Required
**Issue:** Many scripts fail without `.env` file present.
**Workaround:** Always run `cp .env.example .env` first, even for linting/type checking.

### 3. Slow Type Checking
**Issue:** `pnpm typecheck` can take 2-3+ minutes across 41+ packages.
**Workaround:** This is normal. Be patient or use `turbo typecheck` for caching benefits.

### 4. Turbo Telemetry Warning
**Issue:** First turbo run shows telemetry collection notice.
**Workaround:** This is informational only. Set `TURBO_TELEMETRY_DISABLED=1` in environment to disable.

### 5. Database Driver Configuration
**Issue:** Tests/builds may fail if DB_DRIVER not set correctly.
**Workaround:** Default `.env.example` uses `better-sqlite3` which works out of the box. Use this for development.

## Project Architecture

### Monorepo Structure
This is a **pnpm workspace** managed by **Turborepo**. Key configuration files:
- `pnpm-workspace.yaml` - Defines workspace packages
- `turbo.json` - Turborepo pipeline configuration
- `package.json` (root) - Workspace scripts and dependencies

### Main Applications (`apps/`)
1. **nextjs** - Next.js 16 frontend app (port 3000 by default)
   - Uses App Router
   - Includes tRPC API routes
   - Server and client components
   
2. **tasks** - Cron job service (Node.js)
   - Handles scheduled tasks
   - Built to `tasks.cjs`
   
3. **websocket** - WebSocket server (Node.js)
   - Real-time communication
   - Built to `wssServer.cjs`

### Key Packages
- `@homarr/db` - Database layer with Drizzle ORM
- `@homarr/api` - tRPC API definitions
- `@homarr/auth` - Authentication logic (Auth.js)
- `@homarr/integrations` - 40+ service integrations
- `@homarr/ui` - Mantine-based UI components
- `@homarr/widgets` - Dashboard widget system
- `@homarr/common` - Shared utilities
- `@homarr/validation` - Zod schemas

### Configuration Files
- **ESLint:** Each package has `eslint.config.js` (flat config), base in `tooling/eslint/`
- **TypeScript:** Base configs in `tooling/typescript/base.json`, extended per package
- **Prettier:** Shared config `@homarr/prettier-config` in `tooling/prettier/`
- **Vitest:** Root `vitest.config.mts` with `**/*.spec.ts` pattern
- **Docker:** `Dockerfile` for production builds, `development/development.docker-compose.yml` for dev

## Database Operations

Homarr supports three database drivers. Default is SQLite (`better-sqlite3`).

```bash
# SQLite (default - recommended for development)
pnpm db:push                    # Push schema changes
pnpm db:studio                  # Open Drizzle Studio
pnpm db:migration:sqlite:generate  # Generate migration
pnpm db:migration:sqlite:run       # Run migrations

# MySQL
pnpm db:migration:mysql:generate
pnpm db:migration:mysql:run

# PostgreSQL  
pnpm db:migration:postgresql:generate
pnpm db:migration:postgresql:run
```

**Note:** Migrations are in `packages/db/migrations/`. Always run migrations after schema changes.

## Making Code Changes

### Before Making Changes
1. Ensure you have the correct Node/pnpm versions
2. Copy `.env.example` to `.env`
3. Run `pnpm install --frozen-lockfile`
4. Run `pnpm lint` and `pnpm typecheck` to establish baseline (note any pre-existing errors)

### During Development
1. Make focused, minimal changes
2. Run relevant tests: `pnpm test` (or specific package test)
3. Check types: `pnpm typecheck` (if touching TypeScript)
4. Lint your changes: `pnpm lint:fix`
5. Format your code: `pnpm format:fix`

### Before Committing
1. Run full validation pipeline:
   ```bash
   cp .env.example .env  # Ensure env is present
   pnpm lint && pnpm lint:ws
   pnpm format
   pnpm typecheck
   pnpm test
   ```
2. For UI changes in `apps/nextjs`, test with `pnpm dev` and verify in browser
3. For API changes in `packages/api`, run related integration tests
4. Build to ensure no build-time errors: `pnpm build`

### Common Patterns
- **Adding a new package:** Use `pnpm package:new` (turbo generator)
- **Adding dependencies:** Use workspace protocol - `workspace:^0.1.0`
- **Shared configs:** Extend from `tooling/` packages
- **Database changes:** Update schema in `packages/db/schema/`, generate migration, run migration

## Validation Checklist

Run these commands to fully validate your changes match CI requirements:

```bash
# 1. Environment setup
cp .env.example .env

# 2. Install (if dependencies changed)
pnpm install --frozen-lockfile

# 3. Linting
pnpm lint
pnpm lint:ws

# 4. Formatting
pnpm format

# 5. Type checking
pnpm typecheck

# 6. Testing
pnpm test

# 7. Build
cross-env CI=true pnpm build

# 8. E2E (if relevant, requires Docker)
# Build Docker image first, then:
# pnpm exec playwright install chromium
# pnpm test:e2e
```

**Expected Results:**
- All commands should exit with code 0
- Lint/format should show no errors
- Type check may take 2-3 minutes but should complete
- Tests should pass (ignore pre-existing failures in unrelated areas)
- Build should complete in 2-5 minutes

## Tips for Efficient Development

1. **Use Turbo caching:** Turbo caches task outputs. Repeated runs are much faster.
2. **Target specific packages:** `pnpm -F @homarr/api test` (filter to specific package)
3. **Parallel execution:** Turborepo runs tasks in parallel where possible
4. **Watch mode:** Many commands support watch: `pnpm --filter @homarr/api dev`
5. **Skip optional builds:** Use `--ignore-scripts` if native deps are problematic
6. **Database:** Use SQLite for development (fastest, no setup required)
7. **Hot reload:** Next.js dev server has fast refresh - use `pnpm dev`
8. **Turbo Graph:** Run `turbo build --graph` to visualize dependencies

## Common Errors and Solutions

| Error | Solution |
|-------|----------|
| "Unsupported environment (bad pnpm and/or Node.js version)" | Use Node 24.12.0 and pnpm 10.27.0 exactly |
| "Cannot find module '.env'" | Run `cp .env.example .env` |
| "cpu-features install failed" | Ignore - it's optional. Use `--ignore-scripts` if needed |
| "fetch failed" from definitions package | Ignore - happens when homarr.dev unreachable |
| "turbo not found" | Install: `pnpm add -g turbo` |
| Linting errors on import order | Run `pnpm lint:fix` |
| Type errors in node_modules | May need `pnpm install` again |
| Build fails with "CI not set" | Use `cross-env CI=true pnpm build` |
| Tests fail with DB errors | Ensure `.env` has `DB_DRIVER=better-sqlite3` |

---

**Trust these instructions:** Only search for additional information if something here is incorrect or incomplete. These instructions are comprehensive and validated against the actual codebase and CI/CD pipelines.
