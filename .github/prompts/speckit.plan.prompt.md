---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Documentation Output Structure (MANDATORY - Principle IX)

**All output files MUST follow topic-based folder structure with specify-command subfolders:**

```
docs/bydate/YYYY-MM-DD-{TOPIC-NAME}/
└── speckit-plan/
    ├── YYYY-MM-DD-research.md
    ├── YYYY-MM-DD-data-model.md
    ├── YYYY-MM-DD-contracts/
    │   ├── YYYY-MM-DD-{entity-1}-contract.md
    │   └── YYYY-MM-DD-{entity-2}-contract.md
    ├── YYYY-MM-DD-quickstart.md
    └── YYYY-MM-DD-implementation-status.md
```

**Topic Name Rules:**
- Format: Descriptive kebab-case matching feature/bug (e.g., `topnav-auth-display-bug`)
- Prefix with YYYY-MM-DD matching session date
- Example full path: `docs/bydate/2025-11-02-topnav-auth-display-bug/speckit-plan/2025-11-02-research.md`

## Outline

1. **Setup**: Run `.specify/scripts/powershell/setup-plan.ps1 -Json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH, TOPIC (if available). For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Create topic folder**: Establish `docs/bydate/YYYY-MM-DD-{TOPIC}/speckit-plan/` directory structure before generating files.

4. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution (validate Principles I-IX)
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate `YYYY-MM-DD-research.md` in `speckit-plan/` (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate `YYYY-MM-DD-data-model.md`, `contracts/`, `YYYY-MM-DD-quickstart.md` in `speckit-plan/`
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

5. **Stop and report**: Command ends after Phase 2 planning. Report branch, topic folder, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `docs/bydate/YYYY-MM-DD-{TOPIC}/speckit-plan/YYYY-MM-DD-research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: `speckit-plan/YYYY-MM-DD-research.md` with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `speckit-plan/YYYY-MM-DD-research.md` complete

1. **Extract entities from feature spec** → `speckit-plan/YYYY-MM-DD-data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `speckit-plan/contracts/YYYY-MM-DD-{entity}-contract.md`

3. **Generate quickstart** in `speckit-plan/YYYY-MM-DD-quickstart.md`:
   - Testing procedures
   - Development workflow
   - Common debugging patterns

4. **Agent context update**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: 
- `speckit-plan/YYYY-MM-DD-data-model.md`
- `speckit-plan/contracts/YYYY-MM-DD-{entity}-contract.md` (one per entity)
- `speckit-plan/YYYY-MM-DD-quickstart.md`
- Agent-specific context file updated

## Key rules

- Use absolute paths with topic folder structure
- ALL output in `docs/bydate/YYYY-MM-DD-{TOPIC}/speckit-plan/` (Principle IX compliance)
- ERROR on gate failures or unresolved clarifications
- Validate against Constitution Principles I-IX before finalizing
