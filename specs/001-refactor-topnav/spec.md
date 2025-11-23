# Feature Specification: TopNav Component Refactoring and Modularization

**Feature Branch**: `001-refactor-topnav`  
**Created**: 2025-11-02  
**Status**: Draft  
**Input**: Refactor TopNav component: modularize into sub-components (SearchBar, ThemeToggle, NotificationsDropdown, UserMenuDropdown), improve state management and sync, replace mocked notifications with real Supabase fetching, enhance accessibility (ARIA labels, focus trapping), optimize performance (useMemo, useCallback, React.memo), add error handling and i18n support, fix infinite loops and edge cases

## Executive Summary

The existing TopNav component is a monolithic ~1010-line React component handling multiple concerns: navigation, search, notifications, theme switching, user menu, and mobile responsiveness. This refactoring initiative will decompose it into focused, reusable sub-components with improved state management, real-time data fetching, accessibility compliance, and performance optimization. The result will be a maintainable, testable, and performant navigation header that provides a solid foundation for future feature additions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Searches for Tickets Efficiently (Priority: P1)

As an admin user, I need to quickly search for SILPANA tickets and pages from the navigation bar so that I can access frequently-needed information without leaving the current page.

**Why this priority**: Search is a core discovery mechanism for admins managing tickets. A responsive, reliable search experience directly impacts productivity and reduces navigation friction.

**Independent Test**: Can be fully tested by opening the search bar, typing a ticket code or keyword, verifying results appear with proper filtering and keyboard navigation, and successfully navigating to a result. Delivers immediate value without requiring notifications or other features.

**Acceptance Scenarios**:

1. **Given** user is authenticated as admin, **When** user clicks search input or presses Cmd/Ctrl+K, **Then** search bar becomes active with focus and placeholder text is visible
2. **Given** search bar is open with query "AK001", **When** search debounces for 300ms, **Then** matching SILPANA tickets appear in dropdown with ticket code, description, status badge, and clickable href
3. **Given** search results are displayed, **When** user presses ArrowDown or ArrowUp keys, **Then** results highlight in sequence with proper ARIA announcement
4. **Given** search results are highlighted, **When** user presses Enter, **Then** page navigates to ticket detail page
5. **Given** search encounters network error during fetch, **When** user sees dropdown, **Then** error message displays gracefully and UI remains interactive
6. **Given** user is not admin, **When** user attempts search, **Then** page results still appear but ticket results are filtered out
7. **Given** search query is empty or less than 2 characters, **When** dropdown exists, **Then** it closes and no API calls are made

---

### User Story 2 - User Receives Real-Time Notifications (Priority: P1)

As an authenticated user, I need to receive real-time notifications from Supabase and manage them through a dropdown in the navigation so that I stay informed about important system events without losing context of my current work.

**Why this priority**: Real-time notifications are critical for user engagement and system awareness. Replacing mocked notifications with real Supabase data is essential for actual production use.

**Independent Test**: Can be fully tested by observing notification dropdown with real or simulated Supabase data, verifying unread count badge appears/disappears, clicking a notification to mark it as read, and verifying UI updates without page reload.

**Acceptance Scenarios**:

1. **Given** user is authenticated with unread notifications in Supabase, **When** TopNav renders, **Then** bell icon displays red unread badge with count
2. **Given** bell icon is visible, **When** user clicks bell, **Then** notifications dropdown slides in with smooth animation showing up to 10 most recent notifications
3. **Given** notifications dropdown is open, **When** Supabase broadcasts a new notification via real-time channel, **Then** dropdown updates without requiring refresh
4. **Given** notification has type "warning" or "error", **When** dropdown displays notification, **Then** it shows appropriate color/icon indicator
5. **Given** notification has action_json with label and href, **When** user sees notification, **Then** action button appears and clicking navigates
6. **Given** unread notification is visible, **When** user clicks notification, **Then** notification is marked as read in Supabase and badge count decreases
7. **Given** no unread notifications exist, **When** TopNav renders, **Then** bell icon has no badge and tooltip says "No new notifications"
8. **Given** Supabase connection fails initially, **When** TopNav mounts, **Then** notifications gracefully show empty state, not error state

---

### User Story 3 - User Switches Themes with Smooth Animation (Priority: P2)

As any user, I need to switch between light and dark themes using a button in the navigation so that I can choose my preferred visual appearance with clear visual feedback.

**Why this priority**: Theme switching is a UX enhancement that improves user comfort. It's non-blocking for core functionality but enhances perceived polish and accessibility.

**Independent Test**: Can be fully tested by clicking theme toggle button, observing smooth icon animation and theme change, verifying persistence across page refreshes, and ensuring animations perform smoothly.

**Acceptance Scenarios**:

1. **Given** user is on light theme, **When** user clicks theme toggle, **Then** smooth animation shows Sun icon rotating/scaling out and Moon icon scaling/rotating in
2. **Given** theme toggle is clicked, **When** animation completes, **Then** entire application theme switches to dark mode with no layout shift
3. **Given** theme is dark, **When** user clicks toggle, **Then** Sun icon appears and Moon fades out, theme switches to light
4. **Given** user switches theme, **When** user closes tab and reopens page, **Then** selected theme persists
5. **Given** theme toggle button is hovered, **When** mouse is over button, **Then** subtle scale animation provides feedback (scale 1.05)
6. **Given** theme toggle button is visible, **When** screen reader user focuses it, **Then** ARIA label reads "Switch to [light|dark] mode"

---

### User Story 4 - User Can Access Profile and Logout Securely (Priority: P1)

As an authenticated user, I need to click my avatar/user menu to access profile settings and logout functionality, with proper cleanup of all local state, subscriptions, and redirect to login page for security.

**Why this priority**: User menu and logout are critical for authentication flow and security. Improper cleanup could leave active subscriptions or sensitive data in memory.

**Independent Test**: Can be fully tested by clicking user menu, verifying user info displays correctly, clicking logout, verifying all subscriptions are cleaned up, and confirming redirect to login page occurs.

**Acceptance Scenarios**:

1. **Given** user is authenticated, **When** TopNav renders, **Then** user avatar appears (or fallback initials if avatar missing)
2. **Given** user avatar is visible, **When** user clicks avatar, **Then** dropdown menu slides in with user name, email, settings, help, and logout options
3. **Given** user dropdown is open and user has no avatar_url, **When** component mounts, **Then** avatar is fetched from Go backend profile endpoint
4. **Given** avatar fetch from backend fails, **When** dropdown renders, **Then** user still sees menu with fallback avatar (initials or placeholder) and no error
5. **Given** logout button is visible, **When** user clicks logout, **Then** button shows loading spinner and is disabled during logout request
6. **Given** user clicks logout, **When** logout completes successfully, **Then** localStorage is cleared, Supabase auth session ends, and user redirects to login page
7. **Given** logout request encounters error, **When** error occurs, **Then** toast notification shows error message and button re-enables for retry
8. **Given** user is not authenticated (no user object), **When** TopNav renders, **Then** user menu is hidden or shows login button instead

---

### User Story 5 - Mobile User Toggles Sidebar Navigation (Priority: P2)

As a mobile user, I need to toggle the sidebar menu from the navigation using a hamburger button, so that I can access navigation on small screens without losing the ability to view main content.

**Why this priority**: Mobile responsiveness is essential for a modern web app. Sidebar toggle accessibility ensures all users can navigate effectively.

**Acceptance Scenarios**:

1. **Given** viewport width is less than 768px, **When** TopNav renders, **Then** hamburger menu button is visible and search bar is hidden
2. **Given** hamburger button is visible, **When** user clicks button, **Then** icon animates from Menu to X and setIsMobileSidebarOpen(true) is called
3. **Given** sidebar is open, **When** user clicks hamburger again, **Then** icon animates back to Menu and setIsMobileSidebarOpen(false) is called
4. **Given** hamburger button has focus, **When** screen reader user navigates to it, **Then** ARIA label reads "Open mobile menu" or "Close mobile menu" based on state

---

### User Story 6 - Admin Sees Enhanced Administrative Features (Priority: P3)

As an admin user, I need to see expanded search capabilities (ticket search) and access to administrative features in the user menu so that I have quick access to administrative tasks.

**Why this priority**: Admin-specific features are valuable but don't block core functionality. Non-admins use base features without these enhancements.

**Acceptance Scenarios**:

1. **Given** authenticated user is admin, **When** search is performed, **Then** results include SILPANA ticket search from database
2. **Given** authenticated user is not admin, **When** search is performed, **Then** results exclude ticket search and only show page shortcuts

---

### Edge Cases

- What happens when user profile avatar URL is invalid or image fails to load? → Show fallback with user initials
- How does system handle when Supabase notifications subscription fails? → Show empty state gracefully, not error state
- What happens if user has no email in user object? → Show graceful fallback UI (e.g., "Account" instead of email) instead of crash
- How does system handle rapidly toggling theme multiple times? → Animations queue smoothly, no flickering
- What happens if search receives network timeout? → Display error message after timeout, allow retry without page refresh
- How does system handle when user is logged out but TopNav still renders? → Hide user menu, show login button, disable search and notifications
- What happens if user's avatar takes >2 seconds to fetch from backend? → Show placeholder immediately, update when avatar arrives
- How does system handle when multiple notifications arrive simultaneously from Supabase? → All are added to list smoothly, unread count updates correctly

## Requirements *(mandatory)*

### Functional Requirements

#### Main Component (TopNav.tsx) - Orchestrator

- **FR-001**: Component MUST accept user object via props and handle null/incomplete user states gracefully
- **FR-002**: Component MUST sync user data from props to local state with priority: prop.email > localStorage > null
- **FR-003**: Component MUST provide consistent, memoized click-outside handlers for all dropdowns
- **FR-004**: Component MUST render mobile-responsive layout: hamburger on <768px, full navbar on ≥768px
- **FR-005**: Component MUST maintain SilpanaGuestAccess component as-is in the navbar
- **FR-006**: Component MUST handle keyboard shortcuts (Cmd/Ctrl+K for search)
- **FR-007**: Component MUST clean up all subscriptions and state on unmount

#### SearchBar Sub-Component

- **FR-008**: Component MUST accept search query state and debounce at 300ms
- **FR-009**: Component MUST query Supabase silpana table for tickets matching ticket_code or nama_pengaduan (admin-only)
- **FR-010**: Component MUST support page shortcut search (Dashboard, Analytics, Profile, Settings)
- **FR-011**: Component MUST limit results to 8 items maximum
- **FR-012**: Component MUST handle network errors gracefully with user-visible error message
- **FR-013**: Component MUST support keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
- **FR-014**: Component MUST announce results to screen readers via ARIA live regions
- **FR-015**: Component MUST have role="combobox" and aria-autocomplete="list"
- **FR-016**: Component MUST close dropdown when Escape is pressed or focus moves outside

#### ThemeToggle Sub-Component

- **FR-017**: Component MUST toggle between light and dark themes using next-themes setTheme
- **FR-018**: Component MUST animate theme switch with Sun/Moon icons using Framer Motion
- **FR-019**: Component MUST persist theme choice via next-themes (automatic)
- **FR-020**: Component MUST have aria-label with current/target theme

#### NotificationsDropdown Sub-Component

- **FR-021**: Component MUST fetch notifications from Supabase with real-time subscription
- **FR-022**: Component MUST display up to 10 most recent notifications, ordered by time descending
- **FR-023**: Component MUST show unread count badge on bell icon when unread notifications exist
- **FR-024**: Component MUST display notification type via icon/color: info (blue), warning (orange), error (red), success (green)
- **FR-025**: Component MUST show notification action button if action_json contains label and href
- **FR-026**: Component MUST mark notification as read when clicked (update Supabase read column)
- **FR-027**: Component MUST subscribe to Supabase real-time notifications channel and update UI when new notifications arrive
- **FR-028**: Component MUST handle Supabase subscription errors gracefully (empty state, not error state)
- **FR-029**: Component MUST unsubscribe from Supabase channel on unmount
- **FR-030**: Component MUST have aria-label "View notifications" and aria-expanded attribute

#### UserMenuDropdown Sub-Component

- **FR-031**: Component MUST display user avatar (from backend fetch or localStorage) or fallback to initials
- **FR-032**: Component MUST display user name and email (or fallback if missing)
- **FR-033**: Component MUST fetch avatar from Go backend endpoint if avatar_url is missing at mount
- **FR-034**: Component MUST show profile settings, help, and logout menu items
- **FR-035**: Component MUST handle logout with full cleanup: localStorage clear, Supabase signOut, redirect to login
- **FR-036**: Component MUST show loading spinner on logout button during request
- **FR-037**: Component MUST show toast error if logout fails and allow retry
- **FR-038**: Component MUST handle missing email/avatar gracefully without crashing

#### Mobile Toggle Sub-Component (MobileMenuToggle)

- **FR-039**: Component MUST render hamburger button (Menu icon) on <768px breakpoint only
- **FR-040**: Component MUST animate icon between Menu and X using 180° rotation on 0.2s duration
- **FR-041**: Component MUST have aria-label and aria-expanded ARIA attributes
- **FR-042**: Component MUST call setIsMobileSidebarOpen callback on click

### Performance & Technical Requirements

- **FR-043**: All event handlers MUST be wrapped in useCallback to prevent unnecessary re-renders
- **FR-044**: Memoized computations MUST use useMemo (e.g., filtered notifications, search results)
- **FR-045**: Sub-components MUST be wrapped in React.memo to prevent re-renders from parent state changes
- **FR-046**: All notifications fetches MUST use loading and error states
- **FR-047**: Search debounce timeout MUST be cleared on component unmount and when search query resets
- **FR-048**: Framer Motion animations MUST use `initial={false}` and `transition` props for smooth performance
- **FR-049**: All useEffect hooks MUST have explicit dependency arrays to prevent infinite loops

### Accessibility Requirements

- **FR-050**: All interactive elements MUST have descriptive aria-label attributes
- **FR-051**: Dropdown menus MUST support keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
- **FR-052**: Dropdown menus MUST trap focus within the dropdown while open
- **FR-053**: All status badges/counts MUST be announced to screen readers
- **FR-054**: Search input MUST have role="combobox" and aria-autocomplete="list"
- **FR-055**: Search results MUST use ARIA live region (role="region" aria-live="polite") for dynamic announcements
- **FR-056**: All buttons MUST have hover/focus states with visual feedback (color change, scale, underline)
- **FR-057**: Color must not be the only indicator of status (use icons + text/labels)

### Internationalization Requirements

- **FR-058**: All user-visible strings MUST use i18n function (assume useTranslation hook from next-intl)
- **FR-059**: All error messages MUST support Indonesian translation
- **FR-060**: All tooltips and ARIA labels MUST support translation

### Error Handling Requirements

- **FR-061**: Network errors from Supabase (search, notifications, profile fetch) MUST show user-friendly toast or UI message
- **FR-062**: Failed logout MUST show toast error and allow retry without page refresh
- **FR-063**: Missing user data (email, avatar) MUST result in graceful fallback UI, not crash
- **FR-064**: Timeout errors MUST be caught and displayed with clear message to user

### Key Entities *(data-related)*

- **User**: Represents authenticated user with id, email, name, avatar_url, role (from auth/Go backend)
- **Notification**: Table in Supabase with columns: id, user_id, title, message, time, read (boolean), type (string enum), action_json (object with label, href)
- **Ticket**: SILPANA ticket entity in Supabase silpana table with id, ticket_code, nama_pengaduan, status, priority_level, created_at

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Component renders without errors when user is null, incomplete, or complete (3 states pass unit tests)
- **SC-002**: Search results appear in <500ms from user typing (including 300ms debounce) with <100ms API response
- **SC-003**: Keyboard navigation (ArrowUp, ArrowDown, Enter) works in search dropdown with no manual mouse interaction
- **SC-004**: Theme toggle animation completes smoothly (60 FPS, no jank) with icon transition in <300ms
- **SC-005**: Notifications update in real-time from Supabase with <100ms latency from broadcast to UI render
- **SC-006**: Logout completes in <2 seconds from button click to redirect to login page
- **SC-007**: Mobile hamburger menu animation completes in <200ms and icon rotates 180° smoothly
- **SC-008**: All user-visible strings support Indonesian translation with no hardcoded English
- **SC-009**: Screen reader announces all status changes (notifications count, notification marks read, dropdown opens/closes)
- **SC-010**: Component supports up to 100 simultaneous notifications without performance degradation
- **SC-011**: Search handles network timeout gracefully (timeout set to 5 seconds, error message shown)
- **SC-012**: Avatar fetch from Go backend completes in <1 second or fallback displays immediately
- **SC-013**: All React components pass eslint rules with no unused vars, proper dependencies, and no circular imports
- **SC-014**: Code coverage for new components: ≥80% line coverage, ≥75% branch coverage
- **SC-015**: No infinite loops detected in useEffect hooks during 5-minute runtime stress test

## Assumptions

- **Supabase Table Structure**: notifications table exists with columns: id, user_id, title, message, time, read, type, action_json
- **Supabase Real-time**: Real-time subscriptions are enabled for notifications table
- **Go Backend**: Profile endpoint (GoAuthAPI.getProfile()) returns { success, user: { avatar_url? }, error? }
- **i18n Setup**: Project has useTranslation hook from next-intl available globally
- **Authentication Context**: User object passed from parent component is already authenticated and includes id, email, role
- **localStorage Structure**: User info stored under 'selly_user_info' key with { email, avatar_url, ... } structure
- **Lucide Icons**: All icons (Bell, Sun, Moon, Menu, X, Ticket, etc.) are available
- **React Query**: Not required initially; can be added in future optimization phase if needed
- **Focus Management**: Radix UI or custom focus handling available; no new dependencies required
- **next-themes**: Already configured in project for theme persistence

## Dependencies & Constraints

### Existing Dependencies to Maintain

- react, react-dom (Next.js)
- next/navigation, next/themes
- framer-motion (animations)
- lucide-react (icons)
- react-toastify (toast notifications)
- @supabase/supabase-js (Supabase client)
- next-intl (i18n, assumed)
- shadcn/ui (Button, Badge, Tooltip components)

### No New Dependencies Required

- Use existing libraries only
- Keyboard handling: Native browser APIs
- Focus management: Native APIs or Radix UI if already available
- ARIA attributes: Native HTML attributes

### Constraints

- Must maintain 100% backward compatibility with existing TopNav props
- Must not break existing SilpanaGuestAccess integration
- Must not add more than 3 new npm dependencies (ideally 0)
- Mobile-first responsive design (120px+ breakpoint support)
- TypeScript strict mode compliance
- No changes to Go backend endpoints (use existing endpoints)

## Implementation Approach

### File Structure (Modular)

```
frontend/src/components/
├── TopNav.tsx                    # Main orchestrator component
├── TopNav/
│   ├── MobileMenuToggle.tsx      # Hamburger button for mobile
│   ├── SearchBar.tsx             # Search input with Supabase queries
│   ├── ThemeToggle.tsx           # Theme switch button
│   ├── NotificationsDropdown.tsx # Bell icon + notifications list
│   ├── UserMenuDropdown.tsx      # User avatar + menu
│   └── types.ts                  # Shared types and interfaces
```

### State Management

- **TopNav (parent)**: Manages isMobileSidebarOpen, shared user state
- **SearchBar**: Manages searchQuery, searchResults, isSearchOpen, isSearching
- **NotificationsDropdown**: Manages notifications, isNotificationsOpen, real-time subscription
- **UserMenuDropdown**: Manages isUserMenuOpen, isLoggingOut, avatar fetch state
- **ThemeToggle**: Relies on next-themes (no local state)

### Data Flow

1. User object passed from parent via props
2. Each sub-component receives what it needs via props
3. Callbacks passed to sub-components for state updates
4. Supabase subscriptions in NotificationsDropdown managed independently
5. GoAuthAPI calls in UserMenuDropdown for avatar fetch

## Testing Approach

Each sub-component will include comment block with RTL test examples covering:
- Rendering states (loading, error, success)
- User interactions (click, keyboard, focus)
- Async operations (fetch, subscribe)
- Accessibility (ARIA, keyboard navigation)
- Edge cases (no data, network errors, no user)

---

**Document Status**: Ready for implementation planning with `/speckit.plan`  
**Next Phase**: `/speckit.plan` to generate detailed task breakdown and implementation roadmap
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
