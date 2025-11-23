# TopNav Component Refactoring

**Date**: 2025-11-02  
**Branch**: `001-refactor-topnav`  
**Status**: Implementation in progress  
**Scope**: Refactor monolithic TopNav into 6 independently testable components

## Architecture Overview

The TopNav component is being refactored from a monolithic component into a service-oriented architecture with 6 specialized sub-components, each responsible for a single user story.

### Component Structure

```
frontend/src/components/TopNav/
├── TopNav.tsx                          # Orchestrator component (Phase 8)
├── SearchBar.tsx                       # User Story 1: Admin ticket search
├── NotificationsDropdown.tsx           # User Story 2: Real-time notifications
├── ThemeToggle.tsx                     # User Story 3: Theme toggle
├── UserMenuDropdown.tsx                # User Story 4: User menu + logout
├── MobileMenuToggle.tsx                # User Story 5: Mobile hamburger menu
├── types.ts                            # Shared TypeScript interfaces
├── hooks/                              # Custom hooks
│   ├── useClickOutside.ts             # Dropdown close handler
│   ├── useDebounce.ts                 # Search debounce (300ms)
│   └── useKeyboardNavigation.ts       # Arrow/Enter/Escape handling
├── __tests__/                          # Test files
│   ├── SearchBar.test.tsx             # Unit + integration tests
│   ├── NotificationsDropdown.test.tsx # Real-time subscription tests
│   ├── ThemeToggle.test.tsx           # Animation + persistence tests
│   ├── UserMenuDropdown.test.tsx      # Logout flow tests
│   ├── MobileMenuToggle.test.tsx      # Responsive breakpoint tests
│   ├── TopNav.integration.test.tsx    # All components together
│   ├── mockData.ts                    # Mock generators
│   └── setup.ts                       # Jest setup
└── README.md                           # This file
```

### User Story Map

| Priority | User Story | Component | Tasks | Phase |
|----------|-----------|-----------|-------|-------|
| P1 | Admin searches for tickets | SearchBar | 18 | Phase 3 |
| P1 | Real-time notifications | NotificationsDropdown | 18 | Phase 4 |
| P1 | User menu & logout | UserMenuDropdown | 20 | Phase 6 |
| P2 | Theme toggle | ThemeToggle | 10 | Phase 5 |
| P2 | Mobile menu | MobileMenuToggle | 8 | Phase 7 |
| P3 | Admin features | SearchBar (enhancement) | 4 | Phase 8 |

### Technology Stack

- **React**: 18+
- **TypeScript**: Strict mode
- **Next.js**: 15
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: lucide-react
- **Notifications**: react-toastify
- **Theme**: next-themes
- **Backend API**: Go REST API (port 8080)
- **Database**: Supabase with real-time channels
- **Testing**: Jest + React Testing Library
- **Accessibility**: WCAG 2.1 AA compliance

### Constitutional Principles

All components follow the 9 Constitutional Principles:

1. **SOA**: Each component has single responsibility
2. **Performance-First**: Target <50ms cache, <200ms queries, 85%+ hit ratio
3. **Zero Dependencies**: Only use existing packages
4. **Indonesian UX**: All user messages in bahasa baku
5. **Data Sovereignty**: ap-southeast-1/3 regions only
6. **Auth Data Flow**: Email always populated (Principle VI)
7. **Documentation**: All decisions documented
8. **Modular Code**: Components independently testable
9. **API Contracts**: Endpoints documented with errors

## Implementation Phases

### Phase 1: Project Setup (8 tasks)

- [x] T001: Create feature branch
- [x] T002: TypeScript paths (already configured)
- [x] T003: Directory structure
- [x] T004: __tests__ directory
- [x] T005: Supabase client export
- [x] T006: types.ts
- [x] T007: TopNav.backup.tsx
- [x] T008: README.md

### Phase 2: Foundational Utilities (9 tasks)

Creating shared infrastructure that all user stories depend on.

- [ ] T009: useClickOutside hook
- [ ] T010: useDebounce hook (300ms)
- [ ] T011: useKeyboardNavigation hook
- [ ] T012: Complete types.ts interfaces
- [ ] T013: Type exports and unions
- [ ] T014: Supabase query functions
- [ ] T015: Mock data generators
- [ ] T016: Jest setup (Supabase, auth, themes)
- [ ] T017: Update task tracking

### Phase 3: SearchBar Component (18 tasks)

**User Story 1**: Admin searches for tickets efficiently

Requirements:
- 300ms debounce before API call
- Admin-only ticket search
- Keyboard navigation (Arrow/Enter/Escape)
- ARIA compliance
- Cmd/Ctrl+K shortcut

### Phase 4: NotificationsDropdown Component (18 tasks)

**User Story 2**: User receives real-time notifications

Requirements:
- Supabase real-time subscription
- Unread badge
- Mark-read functionality
- Auto-reconnect on connection loss
- Error resilience

### Phase 5: ThemeToggle Component (10 tasks)

**User Story 3**: User switches themes with smooth animation

Requirements:
- Sun/Moon icon animation (<300ms)
- next-themes persistence
- Hover feedback
- ARIA labels

### Phase 6: UserMenuDropdown Component (20 tasks)

**User Story 4**: User accesses profile and logout securely

Requirements:
- Avatar display with initials fallback
- Profile fetch from Go backend
- Secure logout (clear localStorage, unsubscribe, Supabase signOut)
- Constitution VI compliance

### Phase 7: MobileMenuToggle Component (8 tasks)

**User Story 5**: Mobile user toggles sidebar

Requirements:
- Hamburger button <768px breakpoint
- 180° icon rotation animation
- ARIA expanded/label

### Phase 8: Integration & Orchestrator (14 tasks)

**Integration**: Orchestrate all components into TopNav

Requirements:
- Cmd/Ctrl+K focus SearchBar
- User sync on mount
- Subscription cleanup on unmount
- All components working together

## Execution Strategy

### Critical Path

```
Phase 1 (Setup: 1 day)
    ↓
Phase 2 (Foundational: 1-2 days) — BLOCKING all user stories
    ├→ Phase 3 (US1 Search: 3-4 days)
    ├→ Phase 4 (US2 Notifications: 3-4 days)
    ├→ Phase 5 (US3 Theme: 2 days)
    ├→ Phase 6 (US4 UserMenu: 4-5 days)
    ├→ Phase 7 (US5 Mobile: 2 days)
    └→ Phase 8 (Integration: 2 days)
```

### Parallel Execution

After Phase 2 completes, Phases 3-7 can run in parallel:

- **Group A** (2-3 days parallel): Search + Theme + Mobile
- **Group B** (3-4 days parallel): Notifications + UserMenu

### MVP Scope

For quick delivery:

- **Phases 1-3** = SearchBar component only (~3-4 weeks)
- Closes P1 user story with quick win
- Validates infrastructure before other components

### Recommended Team

- 2-3 developers
- Total duration: 10-12 weeks (accounting for QA, code review)
- Sequential: 15-20 weeks (1 developer)

## Quality Gates

### Per-Component Quality Checklist

- [ ] Unit tests >80% coverage
- [ ] Integration tests passing
- [ ] ESLint 0 errors
- [ ] TypeScript strict mode
- [ ] WCAG 2.1 AA accessibility
- [ ] i18n complete (Indonesian)
- [ ] Performance verified
- [ ] Documentation updated

### Final Quality Requirements

- [ ] All 105 tasks completed
- [ ] >80% test coverage per component
- [ ] 0 ESLint errors
- [ ] 0 TypeScript errors
- [ ] 0 accessibility violations
- [ ] All 6 user stories closed
- [ ] All 64 functional requirements met
- [ ] Constitutional Principles I-IX verified

## Keyboard Shortcuts

### SearchBar

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+K` | Focus search input |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Select highlighted result |
| `Escape` | Close dropdown |

### All Components

| Shortcut | Action |
|----------|--------|
| `Escape` | Close any open dropdown |
| `Tab` | Move focus between dropdowns |

## API Integration

### Backend Go API

**SearchBar**:
- `GET /api/v1/tickets/search?q={query}` (admin only)

**NotificationsDropdown**:
- `GET /api/v1/notifications/{userId}`
- `PATCH /api/v1/notifications/{notificationId}/read`

**UserMenuDropdown**:
- `GET /api/v1/users/{userId}/profile`
- `POST /api/v1/auth/logout`

### Supabase Real-Time

**NotificationsDropdown**:
- Channel: `public:notifications`
- Events: INSERT (new), UPDATE (marked read)
- Subscription: per-user room

**UserMenuDropdown**:
- Direct Supabase signOut (no channel needed)

## Performance Targets

- Search debounce: 300ms
- Search results latency: <500ms (300ms debounce + <200ms API)
- Real-time notification delivery: <100ms (broadcast to UI)
- Theme animation: <300ms (60 FPS)
- Logout completion: <2 seconds
- Avatar fetch: <1 second (with fallback to initials)

## Accessibility Standards

All components target **WCAG 2.1 AA** compliance:

- ✅ Semantic HTML (proper roles, labels)
- ✅ Keyboard navigation (Tab, Arrow, Enter, Escape)
- ✅ ARIA attributes (aria-expanded, aria-label, aria-live)
- ✅ Focus management (focus trap, focus restoration)
- ✅ Screen reader support (role="region", aria-label)
- ✅ Color contrast (4.5:1 for text)

## Internationalization (i18n)

All strings use next-intl:

```typescript
// ✅ Correct
const { t } = useTranslations("TopNav.SearchBar");
return <input placeholder={t("placeholder")} />;

// ❌ Wrong
return <input placeholder="Cari tiket..." />;
```

### Required Translations

**SearchBar**: placeholder, error message, no results, keyboard shortcut hint  
**NotificationsDropdown**: empty state, mark read label, error  
**ThemeToggle**: light label, dark label  
**UserMenuDropdown**: profile label, logout label  
**MobileMenuToggle**: menu label, close label

## Testing Strategy

### Unit Tests

- **Scope**: Individual component, isolated dependencies
- **Tools**: Jest + React Testing Library
- **Coverage**: >80% per component
- **Example**: SearchBar debounce timing, ARIA attributes

### Integration Tests

- **Scope**: Multiple components together
- **Tools**: Jest + React Testing Library
- **Coverage**: Component interactions, state flow
- **Example**: TopNav with all sub-components, keyboard navigation

### Performance Tests

- **Scope**: Latency, FPS, memory
- **Tools**: Custom performance benchmarks
- **Coverage**: Animation smoothness, API response time
- **Example**: Theme animation FPS, search latency

## Documentation References

- **Specification**: `/specs/001-refactor-topnav/spec.md` (254 lines, 6 user stories)
- **Data Model**: `/docs/bydate/2025-11-02-topnav-refactor/speckit-plan/2025-11-02-data-model.md`
- **API Contracts**: `/docs/bydate/2025-11-02-topnav-refactor/speckit-plan/contracts/`
- **Task Tracking**: `/docs/bydate/2025-11-02-topnav-refactor/speckit-tasks/2025-11-02-task-tracking.md`
- **Constitution**: `/docs/bydate/2025-11-02-topnav-refactor/speckit-plan/2025-11-02-constitution-check.md`

## Getting Started

### 1. Review the Specification

```bash
# Read the full requirement specification
cat specs/001-refactor-topnav/spec.md
```

### 2. Understand the Data Model

```bash
# Review entities and relationships
cat docs/bydate/2025-11-02-topnav-refactor/speckit-plan/2025-11-02-data-model.md
```

### 3. Check API Contracts

```bash
# Review backend expectations
ls docs/bydate/2025-11-02-topnav-refactor/speckit-plan/contracts/
```

### 4. Start Phase 1

```bash
# Already on correct branch
git status

# Phase 1 tasks T001-T008 already started
# Next: Begin Phase 2 tasks T009-T017
```

### 5. Track Progress

```bash
# Update task tracking as you complete phases
cat docs/bydate/2025-11-02-topnav-refactor/speckit-tasks/2025-11-02-task-tracking.md
```

## Phase Completion Checklist

Use this to verify each phase is complete before moving to next:

### Phase 1 ✅ COMPLETE

- [x] Feature branch created
- [x] TypeScript paths configured
- [x] Directory structure created
- [x] __tests__ directory created
- [x] Supabase client available
- [x] types.ts file created
- [x] TopNav.backup.tsx created
- [x] README.md created

### Phase 2 ⏳ PENDING

- [ ] All hooks created and documented
- [ ] types.ts fully populated with all entities
- [ ] Supabase query functions created
- [ ] Mock data generators created
- [ ] Jest setup completed
- [ ] Task tracking updated

### Phases 3-7 ⏳ PENDING

- [ ] Each phase components created
- [ ] Tests written
- [ ] QA passed
- [ ] Documentation updated

### Phase 8 ⏳ PENDING

- [ ] Orchestrator TopNav.tsx created
- [ ] All sub-components integrated
- [ ] Integration tests passing
- [ ] Final quality gates passed

## Debugging Guide

### Issue: TypeScript path resolution fails

**Solution**: Verify `tsconfig.json` has `"@/*": ["./src/*"]` in `compilerOptions.paths`

### Issue: Supabase subscription not connecting

**Solution**: Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: Tests failing with "Cannot find module"

**Solution**: Verify jest.config.js has `moduleNameMapper` for `@/` alias

### Issue: Animation feels janky

**Solution**: Use Framer Motion with `layout` prop, target 60 FPS with `transform` and `opacity`

## Contributing

When implementing a component:

1. Create feature branch from `001-refactor-topnav`
2. Implement component following TypeScript strict mode
3. Write tests targeting >80% coverage
4. Verify accessibility (axe DevTools)
5. Add i18n translations
6. Submit PR with checklist completed
7. Update task tracking after merge

## References

- **Next.js**: https://nextjs.org/docs
- **React Testing Library**: https://testing-library.com/docs/react-testing-library
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **next-intl**: https://next-intl-docs.vercel.app/
- **Framer Motion**: https://www.framer.com/motion/
- **Supabase Real-time**: https://supabase.com/docs/guides/real-time

---

**Status**: Phase 1 COMPLETE, Phase 2 READY  
**Last Updated**: 2025-11-02  
**Next Phase**: Begin T009 (useClickOutside hook)
