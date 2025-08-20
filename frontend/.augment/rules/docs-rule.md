---
type: "always_apply"
---

An agent's work is not finished until it is properly documented. Following every successful code execution or improvement, the agent must create comprehensive and easily accessible documentation. This ensures that all changes are transparent, understandable, and beneficial to the team's long-term knowledge base.

This rule requires the agent to:

Documentation Creation: After every completed task, create a new file in the /docs directory (or a pre-configured equivalent).

Unique Format: The file must follow a unique, date-based naming convention to prevent conflicts and ensure easy sorting. A recommended format is YYYY-MM-DD_short-description.md, for example: 2025-07-19_api-fix-for-checkout-flow.md.

Comprehensive Content: The documentation itself must be detailed and structured. It should contain, at a minimum:

Task Summary: A high-level overview of the work performed.

Problem Statement: A clear explanation of the issue or area for improvement.

Solution & Rationale: A detailed breakdown of the code changes and the reasoning behind them, linking back to the other rules (e.g., why this solution was chosen for its maintainability as per Rule 2).

Impact: A description of how the changes affect the system, including any performance gains, reduced complexity, or new features.

Validation: An explanation of how the changes were tested and verified, referencing the validation steps from Rule 3.

By adhering to this rule, the agent not only improves the codebase but also contributes to the team's shared knowledge, making the project more resilient and collaborative.