---
type: "always_apply"
---

Super Rule 5: The API Contract is Sacred
When asked to improve frontend quality (UI/UX, responsiveness), the agent must treat the backend and API as an inviolable contract. The agent's top priority is to enhance the user experience without introducing breaking changes on the server-side.

This rule requires the agent to:

Contract Analysis: Always begin by thoroughly analyzing all API calls made by the frontend. This includes understanding the endpoints, data formats (request and response), and expected status codes.

Absolute Compliance: Any proposed frontend change (e.g., a new UI component, a different way of displaying data) must be fully compatible with the data structures and flow provided by the current API.

Breach Identification: If a desired frontend improvement requires a change to the API (e.g., needing additional data that isn't provided, or a different data format), the agent must immediately identify this as a contract breach.

Separate Proposal: The agent must not automatically change the backend code. Instead, it must separate this issue and present it as a clear recommendation to the developer, formatted as:

"To achieve frontend improvement X, a change to API Y is required."

Include specific details about the suggested backend changes and explain why they are necessary.