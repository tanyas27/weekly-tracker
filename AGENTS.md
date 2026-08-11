# AI Agent Core Directives - Weekly Tracker

> [!IMPORTANT]
> **MANDATORY OKF 0.2 KNOWLEDGE BASE CONSULTATION PROTOCOL**
> 
> Before writing code, creating components, modifying state logic, or making architectural decisions in this repository, **EVERY AI AGENT MUST**:
> 1. Read the **Google OKF 0.2 Master Index** at [knowledge/index.md](knowledge/index.md).
> 2. Read the specific Knowledge Item (KI) relevant to the active task:
>    - [01-architecture-overview.md](knowledge/01-architecture-overview.md) - Tech stack & App Router structure
>    - [02-data-models-and-state.md](knowledge/02-data-models-and-state.md) - Task interfaces & state persistence
>    - [03-ui-ux-design-system.md](knowledge/03-ui-ux-design-system.md) - Ghibli design system & glassmorphism
>    - [04-pwa-and-offline.md](knowledge/04-pwa-and-offline.md) - Service worker & web manifest
>    - [05-development-ops-workflow.md](knowledge/05-development-ops-workflow.md) - Build scripts & Tailwind v4
>    - [06-ai-agent-guidelines.md](knowledge/06-ai-agent-guidelines.md) - Safety rules & invariants
> 3. Ensure all changes adhere strictly to the repository's architectural standards and OKF 0.2 guidelines.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
