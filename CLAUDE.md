# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

청담 파트너 VIP (Cheongdam Partners VIP) - A VIP customer loyalty points management system built with React 19 and TypeScript. The app is a mobile-first SPA designed to run on Google AI Studio.

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server on port 3000
npm run build   # Production build
npm run preview # Preview production build
```

## Environment

Set `GEMINI_API_KEY` in `.env.local` (required for AI Studio integration).

## Architecture

### State Management
All application state lives in `App.tsx` using React hooks. Data persists to localStorage with keys prefixed `cp_` (e.g., `cp_customers`, `cp_point_history`, `cp_notifications`).

### Navigation
View-based navigation via `ViewState` type - no router library. The `view` state in App.tsx controls which page component renders.

### Key Types (`types.ts`)
- `Customer` - VIP customer with points, company info, status
- `PointHistory` - Point transaction records
- `Notification` - Customer notifications
- `ViewState` - Union type for all possible views

### Directory Structure
- `pages/` - Full-page view components (Login, Signup, AdminDashboard, CustomerDashboard, etc.)
- `components/UI.tsx` - Shared UI primitives (Button, Input, Card) with variant system

### UI Patterns
- Confirmation modals: Inline in page components using useState (see `CustomerDashboard.tsx` logout modal)
- Button variants: `primary`, `secondary`, `gold`, `danger`, `ghost`

### Styling
Tailwind CSS via CDN with custom colors defined in `index.html`:
- `navy-800/900` - Primary brand color (#1A237E)
- `gold-400/500` - Accent color (#FFD700)

Path alias: `@` maps to project root in `vite.config.ts`.

### Admin Credentials
Hardcoded admin login (check `pages/AdminLogin.tsx` for current values).
