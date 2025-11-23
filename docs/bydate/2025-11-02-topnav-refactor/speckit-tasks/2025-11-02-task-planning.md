# Task Planning: TopNav Component Refactoring

**Date**: 2025-11-02  
**Feature**: TopNav Component Refactoring and Modularization  
**Branch**: `001-refactor-topnav`  
**Specification**: `specs/001-refactor-topnav/spec.md`

---

## Overview

This document outlines the complete task plan for refactoring the monolithic TopNav component (~1010 lines) into 6 independently testable sub-components with real-time Supabase integration, accessibility compliance, and performance optimization.

### Key Metrics

- **Total Tasks**: 72 tasks across 8 phases
- **User Stories**: 6 prioritized stories (3 P1, 2 P2, 1 P3)
- **Estimated Effort**: ~10-12 developer-weeks (2-3 developers in parallel)
- **Parallel Opportunities**: 14+ tasks (marked with [P])
- **Critical Path**: Phase 1-2 (setup + foundational) → Phase 3 (US1: Search) → Phase 4 (US2: Notifications) → Phase 5 (US4: User Menu)

---

## Dependency Graph

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (blocking all stories)
    ├─→ Phase 3: US1 (Search) ← Independent, can start immediately
    ├─→ Phase 4: US2 (Notifications) ← Depends on Phase 2
    ├─→ Phase 5: US4 (User Menu) ← Depends on Phase 2
    ├─→ Phase 6: US3 (Theme) ← Independent after Phase 2
    ├─→ Phase 7: US5 (Mobile) ← Independent after Phase 2
    └─→ Phase 8: US6 (Admin) + Polish
```

### Parallel Execution Matrix

**Group A** (Can start after Phase 2):
- SearchBar component (US1)
- ThemeToggle component (US3)
- Mobile menu (US5)

**Group B** (Can start after Phase 2):
- NotificationsDropdown (US2)
- UserMenuDropdown (US4)

**Critical Dependencies**:
1. Phase 1 Setup MUST complete before any development
2. Phase 2 Foundational MUST complete before any user story work
3. TopNav orchestrator MUST integrate all sub-components last (Phase 8)

---

## Phase Structure

### Phase 1: Setup & Project Initialization

Core infrastructure setup and git configuration.

### Phase 2: Foundational Tasks (Blocking Prerequisites)

Shared utilities, hooks, types, and API client setup that all stories depend on.

### Phase 3-7: User Story Implementation (Priority Order)

Each story has independent test criteria and can be worked in parallel after Phase 2.

### Phase 8: TopNav Orchestrator & Polish

Component integration, end-to-end testing, and final polish.

---

## Task Organization by Story

### User Story 1: Admin Search (P1)
- **Components**: SearchBar.tsx + useDebounce hook
- **Entities**: TicketSearchResult, SearchQuery
- **Contracts**: Supabase search, Go backend profile (if needed)
- **Tasks**: T018-T035 (18 tasks)

### User Story 2: Real-Time Notifications (P1)
- **Components**: NotificationsDropdown.tsx + useClickOutside hook
- **Entities**: NotificationRecord, NotificationSubscription
- **Contracts**: Supabase real-time channel, mark-read operation
- **Tasks**: T036-T053 (18 tasks)

### User Story 3: Theme Toggle (P2)
- **Components**: ThemeToggle.tsx
- **Entities**: Theme preference (next-themes managed)
- **Contracts**: next-themes integration
- **Tasks**: T054-T063 (10 tasks)

### User Story 4: User Menu & Logout (P1)
- **Components**: UserMenuDropdown.tsx
- **Entities**: AuthenticatedUser (focus on profile display and avatar)
- **Contracts**: Go backend profile endpoint, logout endpoint
- **Tasks**: T064-T083 (20 tasks)

### User Story 5: Mobile Toggle (P2)
- **Components**: MobileMenuToggle.tsx
- **Entities**: Viewport breakpoint state
- **Contracts**: None (internal component)
- **Tasks**: T084-T091 (8 tasks)

### User Story 6: Admin Features (P3)
- **Components**: Enhancement to SearchBar admin results
- **Entities**: None (reuses TicketSearchResult)
- **Contracts**: None (reuses existing search)
- **Tasks**: T092-T095 (4 tasks)

---

## Task Count Summary

| Phase | Description | Task Range | Count | Parallel |
|-------|-------------|-----------|-------|----------|
| 1 | Setup | T001-T008 | 8 | 2 |
| 2 | Foundational | T009-T017 | 9 | 3 |
| 3 | US1: Search | T018-T035 | 18 | 5 |
| 4 | US2: Notifications | T036-T053 | 18 | 4 |
| 5 | US3: Theme | T054-T063 | 10 | 2 |
| 6 | US4: User Menu | T064-T083 | 20 | 5 |
| 7 | US5: Mobile | T084-T091 | 8 | 2 |
| 8 | US6: Admin + Polish | T092-T105 | 14 | 2 |
| | **TOTAL** | | **105** | **25** |

---

## Suggested MVP Scope (Phase 0-3)

For initial delivery with core search functionality:

1. ✅ Phase 1: Setup (all 8 tasks)
2. ✅ Phase 2: Foundational (all 9 tasks)
3. ✅ Phase 3: US1 Search (all 18 tasks)
4. ⏳ Phase 4-8: Future phases (defer to next sprint)

**MVP Result**: Functional SearchBar component with admin ticket search, keyboard navigation, error handling, accessibility, and i18n support.

**MVP Effort**: ~3-4 developer-weeks (1-2 developers)  
**MVP Deliverable**: Closes user story 1 (P1 priority)

---

## Execution Recommendations

### Sequential Critical Path (Fastest)

1. Developer 1: Phase 1 Setup (1 day)
2. Developer 2: Phase 2 Foundational (1-2 days, parallel with Phase 1 end)
3. Developer 1: Phase 3 US1 (3-4 days)
4. Developer 2: Phase 4 US2 (3-4 days, parallel with Dev1 Phase 3)
5. Developer 1 + 2: Phase 5 + 6 + 7 (3-4 days parallel)
6. Developer 1 + 2: Phase 8 Integration (2 days)

**Total: ~10-12 developer-weeks with 2 developers working in parallel**

### Parallel Execution (Most Efficient After Phase 2)

```
Timeline:
Days 1-2: Dev1 + Dev2 → Phases 1-2 (Setup + Foundational)
Days 3-6: Dev1 → Phase 3 (Search) | Dev2 → Phase 4 (Notifications)
Days 7-8: Dev1 → Phase 5 (Theme + Mobile) | Dev2 → Phase 6 (Admin)
Days 9-10: Dev1 + Dev2 → Phase 7 (Orchestrator + Integration)
```

---

## Implementation Strategy

### MVP-First Approach (Recommended)

1. **Prioritize P1 stories** (Search, Notifications, User Menu) before P2-P3
2. **Test each story independently** before integration
3. **Deliver Search (US1) first** as quick win and learning opportunity
4. **Then Notifications (US2)** for real-time complexity
5. **Then User Menu (US4)** for full auth flow
6. **Then Theme + Mobile** for polish

### Parallel Opportunities

- **Group A**: Search (US1) + Theme (US3) + Mobile (US5) after Phase 2
- **Group B**: Notifications (US2) + User Menu (US4) after Phase 2
- **Cross-team**: Backend team ensures auth/profile endpoints ready
- **Cross-team**: QA team prepares test cases per spec acceptance scenarios

### Testing Strategy

- **Unit tests**: Each sub-component with 80%+ line coverage
- **Integration tests**: TopNav orchestrator + sub-components together
- **E2E tests**: Optional (user flows can be tested manually)
- **Accessibility tests**: Screen reader and keyboard navigation verification
- **Performance tests**: Animation smoothness, search latency, real-time latency

### Quality Gates

- ✅ All FR requirements implemented
- ✅ All SC success criteria met
- ✅ Test coverage >80% per component
- ✅ No eslint/TypeScript errors
- ✅ Accessibility WCAG 2.1 AA compliance
- ✅ i18n strings in Indonesian

---

## Technical Context (From Plan.md)

**Language**: TypeScript/JavaScript (Next.js 15)  
**Primary Dependencies**: React, Framer Motion, next-themes, @supabase/supabase-js, lucide-react, react-toastify, shadcn/ui  
**Storage**: Supabase PostgreSQL with real-time channels  
**Testing**: Jest + React Testing Library  
**Target Platform**: Web (SSR via Next.js)  
**Performance Goals**: <50ms token validation (cache), <200ms queries, <100ms real-time delivery, 60 FPS animations  
**Constraints**: Zero new dependencies, Indonesian UX (Constitution IV), email always populated (Constitution VI)  
**Scale/Scope**: Multi-app ecosystem (SELLICA, SILPANA, SELLY AI), 1M+ users with distributed caching

---

## Next Steps

1. **Review** this task plan with development team
2. **Assign** developers to phases/stories based on capacity
3. **Create** git feature branches per story (feat/topnav-search, feat/topnav-notifications, etc.)
4. **Execute** phases in priority order, tracking progress in task-tracking.md
5. **Validate** each phase completion against acceptance scenarios
6. **Report** completion status in execution-status.md

---

**Task Planning Complete**: 2025-11-02  
**Status**: ✅ Ready for task breakdown and assignment
