## Test Run Pitfalls (npm run test) and Proposed Fixes

This document lists issues observed in the current codebase that can cause flaky or failing test runs, and the corresponding fixes to apply in code/config. No changes were performed; this is a remediation plan.

### 1) Hardcoded/Implicit Database Configuration in Tests

- Problem: `src/tests/setup.js` instantiates `PrismaClient` and relies on `process.env.DATABASE_URL`. If unset during `npm test`, Prisma fails to connect, causing "fetch failed" errors throughout tests.
- Fix: Ensure tests load a dedicated test env file (e.g. `.env.test`) and that Jest loads it before tests. Use a separate test database URL. Optionally, switch tests to an isolated SQLite database for reliability.

### 2) Multiple PrismaClient Instances

- Problem: `PrismaClient` is created in multiple places (`src/services/authService.js`, `src/services/taskService.js`, `src/middleware/auth.js`, and test setup). Multiple instances increase connection count and can cause contention in tests.
- Fix: Create a single Prisma client module (e.g. `src/prisma/client.js`) that exports a singleton and import it everywhere (services, middleware, tests).

### 3) Database Cleanup Order May Violate FKs

- Problem: Test cleanup deletes models in an order that can conflict with relations depending on cascade rules.
- Fix: Delete in child-to-parent order. For models `TaskTag` -> `Task` -> `Tag`/`User`, delete join/children first. Verify cascade rules match cleanup strategy.

### 4) Rate Limiting Interferes with Tests (429s)

- Problem: Global limiter in `src/app.js` and strict `authLimiter` in `src/routes/auth.js` trigger 429 during fast, repeated test requests.
- Fix: Disable or relax rate limiting when `NODE_ENV === 'test'`. For example, conditionally apply middleware only outside test env, or set very high thresholds during tests.

### 5) JWT Secret Not Provided in Tests

- Problem: `AuthService` signs/verifies JWT using `process.env.JWT_SECRET`. If missing, token generation/verification fails and cascades into test failures.
- Fix: Ensure `.env.test` defines `JWT_SECRET` (and `JWT_EXPIRES_IN` if needed). Load it for Jest.

### 6) Express Helmet CSP Typo

- Problem: In `src/app.js`, `helmet` is configured with `constentSecurityPolicy` (typo). This option is ignored; unexpected header behavior can occur.
- Fix: Rename to `contentSecurityPolicy` or pass a valid Helmet config for Express 5.

### 7) CORS Origin Config May Be Invalid in Tests

- Problem: CORS origin array includes `localhost:3001` without protocol which is invalid. While supertest bypasses CORS, misconfiguration can still lead to inconsistent behavior.
- Fix: Ensure origins include protocol (e.g. `http://localhost:3001`) or disable CORS checks in test env.

### 8) Catch‑All 404 Handler Pattern

- Problem: Prior use of `'*'` route caused `path-to-regexp` errors in Express 5. Code now uses a handler without a path which is correct; verify no other wildcard patterns remain.
- Fix: Keep `app.use((req, res) => ...)` for 404. Avoid `'*'` patterns.

### 9) Logger Noise Slows Tests

- Problem: Verbose logging during tests (`logger.info`, `logger.error`) adds noise and slows runs.
- Fix: In test env, configure logger to minimal/no-op transport.

### 10) Prisma Binary Targets in Docker vs Local

- Problem: When running in Alpine/Docker, Prisma needs `linux-musl-openssl-3.0.x` in `binaryTargets`. Locally it may work with native/debian. Mismatch causes engine init failures.
- Fix: In `schema.prisma` generator, include `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` and re-generate. Not strictly needed for local `npm test`, but impacts CI in Alpine.

### 11) Using Services Directly in Controllers Ties to Live DB

- Problem: Tests call HTTP endpoints which call services that immediately hit the database. With no mocking, tests depend fully on DB availability and schema/migrations.
- Fix: Ensure test database is migrated before tests. Optionally add a pretest script to run `prisma migrate deploy` (or `db push`) against the test DB.

### 12) Tests Depend on Successful Prior Requests

- Problem: Many tests obtain `authToken` by registering/logging in first. If that step fails (DB/rate limit), subsequent tests crash reading `token` from undefined response bodies.
- Fix: Strengthen test setup to assert preconditions; short-circuit when the bootstrap request fails, or move bootstrapping into a resilient shared `beforeAll` with retries.

### 13) Missing `responses` Utility Implementation

- Problem: `src/utils/responses.js` is empty; if controllers or middleware plan to use standardized responses, missing exports will cause runtime errors when referenced.
- Fix: Implement or remove usage. Ensure tests don’t import undefined utilities.

### 14) Prisma Client Path Customization

- Problem: Prisma client is generated to `src/generated/prisma` (custom `output`). All imports must consistently use `require('../generated/prisma')`. Mixing with `@prisma/client` causes init errors.
- Fix: Verify all imports use the custom path across code and tests.

### 15) Global Limiter Config Types

- Problem: In `app.js`, limiter `message` shape differs from some clients’ expectations (object vs string); not harmful, but tests might assert specific properties.
- Fix: Standardize error shape across middleware and tests.

### 16) Missing Test DB Bootstrapping

- Problem: No pretest step runs migrations for the test DB. Queries against non-migrated DB fail.
- Fix: Add an npm `pretest` script to push schema to test DB (e.g., `prisma migrate deploy` or `prisma db push` using `DATABASE_URL` for tests).

### 17) Multiple Date Parsing Paths

- Problem: `dueDate` is parsed with `new Date(dueDate)`; invalid dates may become `Invalid Date` and lead to Prisma errors depending on provider.
- Fix: Validate dates in controllers/validators; ensure tests send valid ISO strings.

### 18) Validation Coverage Gaps

- Problem: Validation middleware exists, but services trust input (e.g., `updateTask` spreads `updateData` directly). Bad input during tests can bubble up as 500s.
- Fix: Tighten controllers/validators to enforce shapes and strip unknown fields before calling services.

### 19) Auth Middleware Prisma Usage

- Problem: `src/middleware/auth.js` queries DB for every request to attach user; under heavy test load this amplifies DB calls and can slow tests or hit connection limits.
- Fix: Cache minimal user claims in JWT and avoid DB call on every request in tests (or within a small TTL), or use a lighter `select` (already minimal) and shared prisma client.

### 20) Jest Timeout and Async Cleanup

- Problem: `testTimeout` is 10s. If DB calls are slow or rate limiting is active, tests may intermittently time out.
- Fix: Disable rate limiting in tests and/or increase timeout if needed; ensure `afterAll` closes Prisma client once.

---

### Minimum Set of Changes to Stabilize Tests

1. Provide `.env.test` with `DATABASE_URL`, `JWT_SECRET`, etc., and load it in Jest.
2. Disable or relax all rate limiting in test env.
3. Use a singleton `PrismaClient` and share it across code and tests.
4. Ensure test DB is migrated before tests (pretest script).
5. Fix Helmet CSP option name.
6. Reorder test cleanup deletes: children/join tables first.
7. Quiet logger in tests.
