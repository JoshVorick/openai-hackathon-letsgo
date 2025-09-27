# Hotel GM Copilot Architecture

## Goals
- Deliver a mobile-first dashboard (now also widened on desktop) that surfaces hotel performance, proactive opportunities, and AI-generated actions within one screen.
- Maintain chatbot capabilities for free-form analysis via an always-available overlay while grounding responses in structured hotel data and generated artifacts.
- Keep the stack composable so real Mews data can replace mocks without rewriting the UI.

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
- Feed the same snapshot + opportunity data into the chat assistant for grounded answers (“Why is Friday down?”).

## Next Steps
1. Stand up the `lib/services/mews` client and add live fetches guarded by a mock fallback flag.
2. Flesh out the opportunities detail route (`/opportunities/[id]`) to review and approve AI plans.
3. Integrate the AI generator for the landing-page opportunity and persist the draft artifact.
4. Replace mock data with live Mews responses once credentials are ready and rate limits are understood.
