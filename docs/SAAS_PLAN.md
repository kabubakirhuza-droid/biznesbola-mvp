# SaaS implementation plan

Preserve the existing Vite/React application, calculator, safety controls and guest learning data. Deploy only to `dev-1eb3/biznesbola-mvp`; the original `biznesbola` project is outside this change.

1. Foundation: server cookie sessions, profiles, tenant membership, guardian links, RLS, audit and migrations.
2. Learner: projects, eight stages, demand checks, tasks, calculations, immutable ledger corrections, goals and portfolio.
3. Learning: age-based lessons, deterministic seeded simulations, contextual Robert, reports and export.
4. Adults: learners, organizations, groups, expiring invitations, assignments, submissions and feedback.
5. Presentation: approved immutable storefront versions, moderation and public-data minimization.
6. Administration: server-guarded content, users, organizations, tickets, flags, audit and measured aggregate analytics.
7. Verification: typecheck/lint/unit/integration/browser/build; document cloud checks requiring credentials without assuming passes.

Guest data stays explicitly local. Authenticated records use PostgreSQL as their source of truth. No mock successful cloud responses. No fixed production admin credentials.
