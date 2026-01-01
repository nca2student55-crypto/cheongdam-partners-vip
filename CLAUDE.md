# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

청담 파트너스 VIP (Cheongdam Partners VIP) - A VIP customer loyalty points management system built with React 19 and TypeScript. Mobile-first SPA for internal use.

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
- `App.tsx` - Main app component with all state management, view routing, and Realtime subscriptions
- `types.ts` - TypeScript type definitions
- `index.tsx` - Entry point
- `pages/` - Full-page view components
- `components/UI.tsx` - Shared primitives (Button, Input, Card, AlertModal)
- `api/supabase.ts` - Supabase client initialization
- `api/client.ts` - Supabase API client with all CRUD operations and data conversion functions

Path alias: `@/` maps to project root (configured in `vite.config.ts`)

### State Management
All state lives in `App.tsx` using React hooks (`useState`/`useEffect`). Data flows exclusively from Supabase - no localStorage fallback or mock data.

### Realtime Data Sync
Supabase Realtime subscriptions in `App.tsx` and `AdminDashboard.tsx` auto-update state on DB changes:
- `customers`, `notifications`, `announcements`, `point_history` (App.tsx)
- `admin_notifications`, `customers`, `announcements` (AdminDashboard.tsx)

Conversion functions are exported from `api/client.ts`: `toCustomer()`, `toNotification()`, `toAnnouncement()`, `toAdminNotification()`

### Navigation
View-based navigation via `ViewState` union type - no router library. The `renderView()` switch statement in `App.tsx` maps view states to page components. Each page receives `setView` callback plus needed state/handlers as props.

### Key Types (`types.ts`)
- `UserStatus` - Enum: `PENDING` (대기), `ACTIVE` (활성), `WITHDRAWN` (탈퇴)
- `Customer` - VIP customer with id, name, phone, password, company, isIndividual, totalPoints, status, timestamps
- `PointHistory` - Point transactions with id, customerId, points, type, reason, createdAt
- `Notification` - Customer alerts with type ('system'/'message'/'announcement')
- `Announcement` - Public announcements with isPinned, isActive, expiresAt
- `Inquiry` - Customer inquiries (profile_change/password_reset)
- `AdminNotification` - Admin alerts (new_signup/inquiry/withdrawal)
- `ViewState` - Union type for all page states

### AlertModal Pattern
All error/success messages use `AlertModal` component:
```typescript
const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertState);
const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
  setAlertModal({ isOpen: true, type, title, message });
};
```

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
| Table | Key Columns |
|-------|-------------|
| customers | id, name, phone, password, company, is_individual, total_points, status, memo |
| point_history | id, customer_id, points, type ('earn'/'use'/'adjust'), reason |
| notifications | id, customer_id, title, content, type, is_read |
| announcements | id, title, content, is_active, is_pinned, expires_at |
| admins | id, username, password, name |
| inquiries | id, customer_id, type ('profile_change'/'password_reset'), content (JSONB), status |
| admin_notifications | id, type ('new_signup'/'inquiry'/'withdrawal'), reference_type, reference_id, title, content, is_read |

### Realtime Publication
All tables above are registered in `supabase_realtime` publication for live updates.

### Data Conversion
Snake_case (DB) ↔ camelCase (frontend) conversion in `api/client.ts`:
- `toCustomer()`, `toPointHistory()`, `toNotification()`, `toInquiry()`, `toAdminNotification()` etc.
- Status enum conversion: 'pending' → `UserStatus.PENDING`

### Phone Number Handling
Phone numbers are normalized (digits only) before storage and comparison. Use `normalizePhone()` in `Login.tsx` and `Signup.tsx`.

## Key Business Flows

### Signup Flow
1. **TERMS**: Privacy policy agreement (Korean 개인정보보호법 compliance)
2. **FORM**: Customer info input → Creates customer with `status: 'pending'`
3. Admin approves via AdminDashboard "승인 대기" tab → Status changes to 'active'

### Customer Inquiry System
- ProfileEdit: "관리자 문의" links under name/phone fields
- Login: "비밀번호 찾기" modal with name/phone input
- Both create entries in `inquiries` table + admin notification

### Admin Notification System
AdminDashboard "알림" tab shows notifications for:
- New signups (green badge)
- Customer inquiries (blue badge)
- Withdrawals (red badge)

## Key API Functions (`api/client.ts`)

```typescript
// Customer management
api.getPendingCustomers()
api.approveCustomer(customerId)
api.approveCustomers(customerIds)

// Points
api.addPoints(customerIds, amount)
api.deductPoints(customerIds, amount, reason)

// Inquiries (customer → admin)
api.createProfileChangeInquiry(customerId, field, currentValue)
api.createPasswordResetInquiry(name, phone)

// Admin notifications
api.getAdminNotifications()
api.getUnreadAdminNotificationCount()
api.markAdminNotificationAsRead(id)
api.markAllAdminNotificationsAsRead()

// Admin notification triggers (called automatically)
api.createSignupNotification(customer)
api.createWithdrawalNotification(customer)
```

## MCP Integration

### Supabase MCP
Database access for development/debugging:
- Connection check: `claude mcp list` → `supabase: ✓ Connected`
- Can execute SQL, apply migrations, view logs directly

## Admin Credentials
- Username: `admin`
- Password: `cheongdam2024!`
