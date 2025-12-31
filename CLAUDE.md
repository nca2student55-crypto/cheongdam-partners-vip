# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

청담 파트너 VIP (Cheongdam Partners VIP) - A VIP customer loyalty points management system built with React 19 and TypeScript. Mobile-first SPA for internal use.

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server (http://localhost:3000/cheongdam-partners-vip/)
npm run build   # Production build
npm run preview # Preview production build
```

## Deployment

- **Live URL**: https://nca2student55-crypto.github.io/cheongdam-partners-vip/
- GitHub Actions auto-deploys on push to `main`
- `base: '/cheongdam-partners-vip/'` in `vite.config.ts`

## Architecture

### File Layout (Non-standard)
Source files are in the root directory, not `src/`:
- `App.tsx` - Main app component with all state management and view routing
- `types.ts` - TypeScript type definitions
- `index.tsx` - Entry point
- `pages/` - Full-page view components
- `components/UI.tsx` - Shared primitives (Button, Input, Card)
- `api/supabase.ts` - Supabase client initialization
- `api/client.ts` - Supabase API client with all CRUD operations

Path alias: `@/` maps to project root (configured in `vite.config.ts`)

### State Management
All state lives in `App.tsx` using React hooks (`useState`/`useEffect`). Data flows from Supabase via `api/client.ts`.

### Navigation
View-based navigation via `ViewState` union type - no router library. The `renderView()` switch statement in `App.tsx` maps view states to page components. Each page receives `setView` callback plus needed state/handlers as props.

### Key Types (`types.ts`)
- `UserStatus` - Enum: `PENDING` (대기), `ACTIVE` (활성), `WITHDRAWN` (탈퇴)
- `Customer` - VIP customer with id, name, phone, password, company, isIndividual, totalPoints, status, timestamps
- `PointHistory` - Point transactions with id, customerId, points, type, reason, createdAt
- `Notification` - Alerts with id, customerId, title, content, type ('system'/'message'/'announcement'), createdAt, isRead
- `Announcement` - Public announcements with id, title, content, isActive, isPinned, createdAt, expiresAt
- `ViewState` - Union type for all page states (includes `'CUSTOMER_ANNOUNCEMENTS'`)
- `SignupStep` - `'TERMS' | 'FORM'` for signup flow
- `Admin` - Admin user with id, username, password, name, createdAt

### UI Patterns
- Button variants: `primary`, `secondary`, `gold`, `danger`, `ghost`
- Modals: Inline with useState (see `AdminDashboard.tsx`)

### Styling
Tailwind CSS via CDN configured in `index.html`. Custom colors:
- `navy-800/900` (#1A237E/#151B60) - Primary brand color
- `gold-400/500` (#FFD700/#E6C200) - Accent color

## Backend: Supabase

### Configuration
- **Project URL**: https://rbunpzizpkvouhdhxlih.supabase.co
- **Project Ref**: rbunpzizpkvouhdhxlih
- Client initialization in `api/supabase.ts`

### Tables
- **customers**: id, name, phone, password, company, is_individual, total_points, status ('pending'/'active'/'withdrawn'), memo, created_at, withdrawn_at
- **point_history**: id, customer_id, points, type ('earn'/'use'/'adjust'), reason, created_at
- **notifications**: id, customer_id, title, content, type ('system'/'message'/'announcement'), is_read, created_at
- **announcements**: id, title, content, is_active, is_pinned, created_at, expires_at
- **admins**: id, username, password, name, created_at

### Data Conversion
Snake_case (DB) ↔ camelCase (frontend) conversion in `api/client.ts`:
- `toCustomer()`, `toPointHistory()`, `toNotification()`, `toAdmin()`, `toAnnouncement()` - DB → Frontend
- Status enum conversion: 'pending' → `UserStatus.PENDING`, 'active' → `UserStatus.ACTIVE`, 'withdrawn' → `UserStatus.WITHDRAWN`

### Phone Number Handling
Phone numbers are normalized (digits only) before storage and comparison. Use `normalizePhone()` in `Login.tsx` and `Signup.tsx`.

### Admin Credentials
Stored in `admins` table. Admin login uses fixed username 'admin' with password-only input.

## Signup Flow

### Two-Step Process
1. **TERMS**: Privacy policy agreement (Korean 개인정보보호법 compliance)
2. **FORM**: Customer information input

### Approval-Based Registration
- New customers are created with `status: 'pending'`
- Pending users cannot login (shows "관리자 승인 대기 중" message)
- Admin approves via AdminDashboard "승인 대기" tab
- After approval, status changes to 'active' and user can login

## Key API Functions (`api/client.ts`)

```typescript
// Customer approval
api.getPendingCustomers()           // Get list of pending customers
api.approveCustomer(customerId)     // Approve single customer
api.approveCustomers(customerIds)   // Bulk approve multiple customers

// Points management
api.addPoints(customerIds, amount)              // Add points to customers
api.deductPoints(customerIds, amount, reason)   // Deduct points with reason

// Messaging
api.sendMessage(customerIds, title, content)    // Send notification to specific customers
api.sendMessageToAll(title, content)            // Send notification to all active customers

// Announcements
api.getActiveAnnouncements()                    // Get active, non-expired announcements
api.createAnnouncement(announcement)            // Create new announcement
api.updateAnnouncement(announcement)            // Update existing announcement
api.deleteAnnouncement(id)                      // Delete announcement
```

## MCP Integration

### Supabase MCP
Database access for development/debugging:
- Connection check: `claude mcp list` → `supabase: ✓ Connected`
- Can execute SQL, apply migrations, view logs directly

## Project Status

See `HANDOVER.md` for detailed project status, known issues, and next steps.
