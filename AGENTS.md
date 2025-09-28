# Hotel GM Copilot Architecture

## Goals
- Deliver a mobile-first dashboard (now also widened on desktop) that surfaces hotel performance, proactive opportunities, and AI-generated actions within one screen.
- Maintain chatbot capabilities for free-form analysis via an always-available overlay while grounding responses in structured hotel data and generated artifacts.
- Keep the stack composable so real Mews data can replace mocks without rewriting the UI.

## Product Vision
- Position the product as a "Hotel Chief of Staff" that handles revenue management decisions for busy boutique hoteliers, offering explainable guidance plus hands-off execution.
- Optimize for on-the-go usage (mobile-first UI, concise action cards, voice/chat input) so GMs can review and approve actions while away from a desk.

## Frontend
- `app/dashboard/page.tsx` renders the hotel snapshot (carousel with occupancy + placeholders, opportunities grid) using server components for fast data access; the same page is exported at `/`.
- Reuse Tailwind and shadcn primitives for cards, buttons, and layout; progressively enhance charts with a lightweight client component once a charting library is introduced.
- Chat lives in `components/chat-overlay.tsx` as a floating launcher that opens the existing chat UI in-place, keeping the copilot reachable from any page.
- Introduce reusable components under `components/dashboard/*` (carousel, chart, opportunity card) as fidelity increases.

## Backend
- Create internal API routes under `app/api/internal/*` for hotel snapshots, opportunities, and artifact management; these will wrap Mews and persistence calls.
- Persist fetched metrics (`hotel_snapshots`), generated opportunities (`opportunities`), and AI artifacts (`artifacts`) via Drizzle + Neon so data is queryable across sessions.
- Schedule an `OpportunityGenerator` job (cron or manual trigger) that enriches hotel metrics with external event feeds and prompts the AI SDK for structured recommendations.

## Mews Integration
- Configure credentials with environment vars: `MEWS_BASE_URL`, `MEWS_CLIENT`, `MEWS_HOTEL_ID`, `MEWS_CONFIGURATION_ID`, optional `MEWS_API_KEY` if needed for authenticated flows.
- Wrap Distributor API calls in `lib/services/mews/*` modules. Start with `hotels/getAvailability`, `reservations/getPricing`, and `availabilityBlocks/getAll` to populate occupancy, rate, and block data.
- Cache static configuration (`configuration/get`, `hotels/get`, `currencies`, `languages`) to limit repeat requests and expose hotel metadata to the UI.

## AI Workflows
- Use the Vercel AI SDK `generateObject` helper with a strict `Opportunity` schema to produce actionable insights (`type`, `summary`, `confidence`, `actions`, `artifacts`).
- Persist generated landing pages or pricing adjustments via existing `saveDocument` helpers so opportunities can link to rich previews.
- Feed the same snapshot + opportunity data into the chat assistant for grounded answers (e.g., "Why is Friday down?").

## Key Prompts & UX Patterns
- **Pricing adjustments**: respond to directives like "lower prices by 15% for October" with analysis, recommended change (possibly throttled), and implementation options (`yes this time`, `always`, `no`).
- **Chart generation**: allow users to request comparisons (e.g., October 2025 vs 2024 weekdays/weekends). The system should run data queries, render bar/line charts, and suggest follow-up actions based on insights.
- **Weekend analysis**: combine occupancy pacing, competitor rates, and rate floor constraints to advise on actions that sell out weekend inventory.
- **Custom pricing algorithm**: detect booking-curve patterns (e.g., >70% occupancy five days out) and offer to roll out revised pricing logic for targeted date ranges with scope controls.
- **Proactive outreach**: push opportunities such as nearby events (e.g., GPT-5 Codex Hackathon) with bundled deliverables (landing page, promo code, ad campaign) and guardrails (auto-expiration dates).

## Insights & Charts Backlog
- Weekly/monthly performance vs. last year (ADR, RevPAR, occupancy) with variance callouts.
- Competitive pricing line graphs with annotations when comps drop rates or struggle.
- Occupancy/ADR bar graphs for the next seven days, comparing current year to prior year.
- Health score / index (green-yellow-red) that summarizes operational risk at a glance.

## Opportunity Review Flow
- Clicking the primary opportunity (`hackathon-event`) should open `/opportunities/[id]` with a review UI that explains why the date is underperforming and what the AI prepared (conference context, landing page summary, approval checklist).
- Show a rich preview (ideal: iframe of the Vercel preview URL) of the generated landing page or artifact so the GM can review copy and layout without leaving the app.
- Include status affordances (progress bar or "in progress" chip) that reflect stages: draft created → PR opened → checks passing → ready to merge → deployed.

## Deployment Automation
- Generate a GitHub PR for landing page artifacts, run the test suite, and surface check outcomes in the review screen before asking for approval.
- After user approval, merge the PR and trigger an automated deploy; update the UI state so the GM sees confirmation and any follow-up steps.
- Capture and persist the Vercel preview URL and other artifact metadata so the dashboard and chat can reference them later.

## Credentials Management
- Store API keys (OpenAI, Google Places, Mews) in `.env` files or secure secrets stores; never commit raw keys. Provide typed accessors in `lib/config` so both the UI and tooling can reference them safely.
- Document required environment variables (`OPENAI_API_KEY`, `GOOGLE_PLACES_API_KEY`, `MEWS_*`) in `README.md` or a deployment runbook.

## Next Steps
1. Stand up the `lib/services/mews` client and add live fetches guarded by a mock fallback flag.
2. Flesh out the opportunities detail route (`/opportunities/[id]`) to review and approve AI plans.
3. Integrate the AI generator for the landing-page opportunity and persist the draft artifact.
4. Replace mock data with live Mews responses once credentials are ready and rate limits are understood.
5. Orchestrate the landing-page deployment flow (PR → checks → Vercel preview → approval) and thread status back into the UI and artifacts table.
6. Implement charting + insight modules that back the conversational and proactive prompts listed above.
