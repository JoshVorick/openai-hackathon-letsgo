# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbo for faster builds
- `pnpm build` - Run database migrations and build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run Ultracite linter/formatter for code quality checks
- `pnpm format` - Auto-fix code formatting and style issues

### Database Operations
- `pnpm db:generate` - Generate Drizzle migrations from schema changes
- `pnpm db:migrate` - Apply database migrations
- `pnpm db:studio` - Open Drizzle Studio for database inspection
- `pnpm db:push` - Push schema changes directly (development only)
- `pnpm db:seed-hotel` - Seed hotel demo data
- `pnpm db:seed-room-rates` - Seed room rate data
- `pnpm db:seed-historical-reservations` - Seed reservation history

### Testing
- `pnpm test` - Run Playwright end-to-end tests with PLAYWRIGHT=True flag

## Architecture Overview

### Project Purpose
This is a **Hotel Revenue Co-Pilot** and **Chief of Staff** application designed specifically for boutique hotel managers. The AI assistant helps automate routine tasks, optimize revenue decisions, and provide intelligent insights for hotel operations.

**Core Value Proposition**:
- Automate repetitive hotel management tasks
- Provide data-driven revenue optimization recommendations
- Answer complex questions about hotel performance and operations
- Act as an intelligent chief of staff for decision support

### Project Structure
This is a Next.js 15 AI-powered hotel management application with a dual architecture:

**Main Chat Application** (`app/(chat)/`)
- Traditional AI chatbot using Vercel AI SDK with xAI/OpenAI models
- Real-time streaming responses with Server-Sent Events
- File upload support for multimodal interactions
- User authentication via NextAuth.js with guest mode
- PostgreSQL persistence via Drizzle ORM

**Hotel Revenue Co-Pilot Dashboard** (`app/dashboard/`, hotel-specific components)
- Mobile-first dashboard for boutique hotel performance monitoring
- AI-generated revenue optimization opportunities and actionable recommendations
- Integration points for Mews PMS (Property Management System)
- Real-time occupancy, rate, and competitive analysis data
- Automated task execution for routine hotel management operations

### Key Technologies
- **Framework**: Next.js 15 with App Router and React Server Components
- **AI**: Vercel AI SDK with xAI Grok models (Vision + Reasoning)
- **Database**: PostgreSQL with Drizzle ORM, includes hotel management schema
- **UI**: Tailwind CSS + shadcn/ui components with Radix primitives
- **Authentication**: NextAuth.js v5 with guest mode support
- **Testing**: Playwright for E2E testing
- **Code Quality**: Ultracite (Biome-based) for formatting/linting

### Chat System Architecture
- **Route Pattern**: `app/(chat)/api/chat/route.ts` handles main chat endpoint
- **Message Format**: Messages use parts-based structure with attachments support
- **Streaming**: Server-Sent Events for real-time AI responses
- **Persistence**: Separate v2 schema for messages (`Message_v2` table)
- **Artifacts**: Support for code, text, image, and sheet artifacts

### Hotel Revenue Co-Pilot Features
- **AI Tools**: Specialized tools in `lib/ai/tools/` for revenue optimization:
  - Occupancy data analysis and forecasting
  - Dynamic rate management and competitor analysis
  - Weather impact on bookings and pricing
  - Hotel settings automation
- **Schema**: Boutique hotel-specific data models (CompanySettings, Services, Rooms, RoomRates)
- **Integration**: Mews PMS integration layer for real hotel data in `lib/services/mews/`
- **Dashboard**: Chief of staff interface with automated insights and actionable recommendations

### Database Schema (Key Tables)
- `User`, `Chat`, `Message_v2` - Core chat functionality
- `Document`, `Suggestion` - AI artifacts and suggestions
- `CompanySettings`, `Services`, `Rooms`, `RoomRates` - Hotel management
- `CompetitorRoomRates` - Competitive analysis data

## Development Guidelines

### Code Quality Standards
- Strict TypeScript configuration with maximum type safety
- Ultracite enforces accessibility standards (WCAG compliance)
- Biome-based formatting for consistent code style
- AI-friendly code generation patterns

### Authentication Flow
- Automatic guest user creation if no session exists (`redirect("/api/auth/guest")`)
- Session persistence across chat interactions
- NextAuth.js v5 configuration in `app/(auth)/auth.config.ts`

### AI Integration Patterns
- Use Vercel AI SDK `streamText` for chat responses
- Tool calling architecture for hotel management functions
- Structured object generation for opportunities and recommendations
- Context preservation across chat sessions via `lastContext` field

### Frontend Patterns
- Server components for data fetching, client components for interactivity
- Chat overlay pattern for universal AI access (`components/chat-overlay.tsx`)
- Responsive design with mobile-first approach
- Theme support with automatic dark/light mode detection

### Environment Setup
- Copy `.env.example` to `.env.local` and configure required variables
- `POSTGRES_URL` required for database connection
- AI Gateway or direct provider API keys for AI functionality
- Vercel deployment recommended for optimal performance

### Known Issues
- Frontend/backend message format mismatch documented in `API_ENDPOINTS.md`
- Deprecated message schema (`Message` table) alongside new `Message_v2`
- Hotel integration requires Mews API credentials for live data

### Testing Strategy
- Playwright E2E tests in `tests/` directory
- Test configuration includes auto-start dev server
- Set `PLAYWRIGHT=True` environment variable when running tests

## Beginner-Friendly Development Rules

### Before Making Any Code Changes
1. **Always explain what you're about to do** - Describe the change in plain English before implementing
2. **Show the impact** - Explain which files will be modified and why
3. **Identify risks** - Point out any potential breaking changes or dependencies
4. **Provide rollback plan** - Explain how to undo changes if something goes wrong

### Code Change Guidelines
1. **Start small** - Make one logical change at a time, avoid large refactors
2. **Test immediately** - Run `pnpm lint` and `pnpm dev` after each change to catch issues early
3. **Explain complex code** - Add comments for any non-obvious logic or business rules
4. **Use descriptive names** - Prefer verbose, clear variable and function names over short ones

### Safety Checks Before Implementation
1. **Database changes** - Always backup-friendly: explain migration impact and reversal steps
2. **Environment variables** - Never expose or modify sensitive config without explicit approval
3. **Dependencies** - Explain why new packages are needed and their security implications
4. **API changes** - Document any breaking changes to endpoints or data structures

### Communication Standards
1. **Plain English summaries** - Explain technical concepts without jargon
2. **Visual confirmations** - Describe what you expect to see after changes (UI changes, console output, etc.)
3. **Error handling** - Always explain what error messages mean and how to fix them
4. **Progress updates** - Keep the user informed during multi-step operations

### Required Approvals
Ask for explicit approval before:
- Installing new npm packages
- Modifying database schema (`lib/db/schema.ts`)
- Changing authentication logic (`app/(auth)/*`)
- Updating environment variables or configuration files
- Making changes that affect the production build process
- Modifying AI model configurations or API integrations

### Development Workflow
1. **Read first** - Always examine existing code patterns before writing new code
2. **Incremental testing** - Test each small change before moving to the next
3. **Document decisions** - Explain why you chose one approach over alternatives
4. **Verify functionality** - Confirm features work as expected in the browser
5. **Check mobile** - Ensure changes work on mobile since this is a mobile-first app

### Common Gotchas to Watch For
- **Message schema** - This app has both old (`Message`) and new (`Message_v2`) message tables
- **Environment setup** - Database and AI provider keys are required for full functionality
- **Chat overlay** - The AI co-pilot is always available as an overlay, don't break this core feature
- **Hotel tools** - Revenue optimization tools in `lib/ai/tools/` require specific boutique hotel data formats
- **Authentication** - Guest mode is automatically created, don't remove this fallback
- **Revenue focus** - Features should prioritize revenue optimization and operational automation for boutique hotels

## OpenAI Codex Hackathon Guidelines

### Project Context
This is a **Hotel Revenue Co-Pilot** submission for the OpenAI Codex hackathon, showcasing AI automation and decision support for boutique hotel managers.

### Commit and PR Authorship
**IMPORTANT**: When creating commits and pull requests, use Codex attribution:

- Add `Co-Authored-By: Codex <noreply@example.com>` to commit messages
- Add `🤖 Generated with Codex` or similar to commit/PR descriptions
- Use branch naming conventions like `codex/feature-name`

**Commit Message Format**:
```
Add occupancy forecasting feature

🤖 Generated with Codex

Co-Authored-By: Codex <noreply@example.com>
```

**Pull Request Format**:
```markdown
## Summary
- Implemented automated rate optimization
- Added competitor analysis dashboard

🤖 Generated with Codex

Co-Authored-By: Codex <noreply@example.com>
```

**Branch Naming Examples**:
- `codex/revenue-optimization`
- `codex/occupancy-dashboard`
- `codex/rate-management`

### Development Focus Areas
- Revenue optimization automation
- Boutique hotel operational efficiency
- AI-powered decision support tools
- Chief of staff functionality for hotel managers
- Integration with existing hotel management systems (Mews PMS)