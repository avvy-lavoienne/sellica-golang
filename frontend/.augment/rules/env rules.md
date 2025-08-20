---
type: "always_apply"
---

General Principles
Consistency is Key: Maintain a consistent coding style, naming conventions, and project structure across your Next.js application.

Performance First: Always consider the performance implications of your code, especially when dealing with data fetching (Supabase) and rendering (Next.js).

Security Minded: Be vigilant about security, particularly when interacting with Supabase and handling user data.

1. Windows Operating System Considerations
Pathing:

Rule: Use Node.js's path module (path.join, path.resolve) for constructing file paths to ensure cross-platform compatibility, rather than hardcoding backslashes (\).

Reason: Windows uses backslashes (\) for paths, while Unix-like systems (which your deployment environment might be) use forward slashes (/).

Line Endings:

Rule: Configure your Git client to handle line endings consistently (e.g., core.autocrlf = input or true depending on your team's preference) to avoid CRLF vs. LF issues.

Reason: Windows typically uses CRLF (Carriage Return, Line Feed), while Unix-like systems use LF. Inconsistent line endings can cause issues in collaborative projects or build processes.

Case Sensitivity:

Rule: While Windows file systems are generally case-insensitive, treat file and directory names as case-sensitive in your code (e.g., import MyComponent from './MyComponent').

Reason: Deployment environments (Linux-based servers) are case-sensitive. Inconsistent casing can lead to "file not found" errors in production.

2. PowerShell Terminal Usage
Environment Variables:

Rule: When setting environment variables in PowerShell for local development, use the $env: prefix (e.g., $env:SUPABASE_URL="your_url"). For persistent variables, use [System.Environment]::SetEnvironmentVariable().

Reason: PowerShell's syntax for environment variables differs from Bash/Zsh. Next.js automatically loads .env files, which is the preferred method for secrets.

Script Execution:

Rule: Ensure any custom PowerShell scripts (e.g., for build automation) are written with PowerShell-specific commands and syntax.

Reason: Commands like ls, cp, rm behave differently or have different aliases compared to Unix commands.

Alias Awareness:

Rule: Be aware of PowerShell aliases (e.g., ls is an alias for Get-ChildItem). When writing scripts, use the full cmdlet names for clarity and robustness.

3. Next.js Framework Specifics
Data Fetching:

Rule: Prefer Next.js's built-in data fetching methods (getServerSideProps, getStaticProps, getStaticPaths) for server-side or build-time data fetching from Supabase. Use useSWR or react-query for client-side fetching.

Reason: Optimizes data loading and rendering based on your page's requirements (SSR, SSG, CSR).

API Routes:

Rule: Use Next.js API routes (pages/api/*) for server-side logic that interacts with Supabase, especially for sensitive operations (e.g., creating users, handling webhooks) or when you need to abstract Supabase client keys.

Reason: Keeps server-side logic separate and secure, preventing exposure of API keys on the client.

Image Optimization:

Rule: Use next/image for all images, especially those served from Supabase Storage.

Reason: Provides automatic image optimization, lazy loading, and responsive sizing, improving performance.

Environment Variables:

Rule: Store sensitive Supabase keys (e.g., SUPABASE_SERVICE_ROLE_KEY) in .env.local and prefix public keys (e.g., NEXT_PUBLIC_SUPABASE_URL) with NEXT_PUBLIC_ to expose them to the browser.

Reason: Next.js handles environment variables securely.

4. Tailwind CSS Integration
Utility-First Approach:

Rule: Embrace the utility-first philosophy. Apply Tailwind classes directly in your JSX for styling, avoiding custom CSS files where possible.

Reason: Speeds up development, reduces CSS bundle size, and promotes consistency.

Configuration:

Rule: Customize your tailwind.config.js for themes, colors, fonts, and responsive breakpoints to match your design system.

Reason: Extends Tailwind's capabilities to fit your specific project needs.

JIT Mode (Just-In-Time):

Rule: Ensure JIT mode is enabled in your tailwind.config.js (it's default in Tailwind CSS v3+).

Reason: Provides incredibly fast compilation times and generates only the CSS you actually use, leading to smaller file sizes.

Purge/Content Configuration:

Rule: Verify that your tailwind.config.js content array correctly points to all files where you use Tailwind classes (e.g., "{pages,components,app}/**/*.{js,ts,jsx,tsx,mdx}").

Reason: Ensures that unused CSS is purged in production builds, keeping your CSS lean.

5. Supabase Integration
Client-Side vs. Server-Side:

Rule: Use the Supabase JavaScript client library. For client-side interactions (e.g., fetching public data, user authentication flow), initialize the client with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. For server-side interactions (API routes, getServerSideProps), use the service role key for privileged access.

Reason: Differentiates secure server operations from public client operations.

Authentication:

Rule: Leverage Supabase Auth for user management. Implement sign-up, sign-in, and sign-out flows using the client library. Handle user sessions securely.

Reason: Supabase provides robust authentication features, including social logins and JWT handling.

Realtime Subscriptions:

Rule: For dynamic data that needs to update instantly (e.g., chat applications, dashboards), use Supabase's real-time subscriptions.

Reason: Provides efficient, instant updates without constant polling.

Row Level Security (RLS):

Rule: Always enable and configure Row Level Security (RLS) on your Supabase tables.

Reason: This is crucial for data security, ensuring users can only access data they are authorized to see, even if they try to bypass your application logic.

Error Handling:

Rule: Implement robust error handling for all Supabase calls, especially for database operations and authentication.

Reason: Provides a better user experience and helps in debugging.

6. pnpm Package Manager
Workspace (Monorepo) Management:

Rule: If you're using a monorepo setup, define your workspaces clearly in pnpm-workspace.yaml.

Reason: pnpm excels at monorepo management, optimizing dependency hoisting and linking.

Dependency Installation:

Rule: Always use pnpm install (or pnpm i) to install dependencies.

Reason: pnpm uses a strict, content-addressable store for dependencies, which can save disk space and speed up installations, but requires consistent usage.

Adding/Removing Dependencies:

Rule: Use pnpm add <package-name> and pnpm remove <package-name> (or pnpm add -D <package-name> for dev dependencies).

Reason: Ensures dependencies are correctly managed within pnpm's unique linking structure.

node_modules Structure:

Rule: Understand that pnpm creates a unique node_modules structure with symlinks. Avoid directly manipulating node_modules directories.

Reason: pnpm's structure is optimized for efficiency; manual changes can break links.

7. AI/Machine Learning Integration (TensorFlow, IndoBERT)
Model Deployment Strategy:

Rule: For client-side inference (e.g., simple image classification, small text processing, or real-time user interaction), use TensorFlow.js directly in your Next.js frontend.

Reason: Leverages client resources, reduces server load, provides immediate feedback, and can work offline.

Rule: For computationally intensive tasks, large models (like IndoBERT), or sensitive operations requiring specialized hardware (GPUs), deploy your AI models on a dedicated backend service (e.g., a Python Flask/FastAPI server, serverless functions, or a containerized service) exposed via Next.js API routes.

Reason: Prevents blocking the Next.js server, provides better scalability, allows for GPU utilization, and keeps heavy computation off the client.

Data Exchange with Supabase:

Rule: Store training data, model metadata, inference results, or user-generated data for AI processing in Supabase. Use Next.js API routes to securely interact with Supabase for AI-related data, especially when dealing with large datasets or sensitive information.

Reason: Provides centralized data management, leverages Supabase's robust database features, and ensures secure data flow.

IndoBERT Integration:

Rule: For IndoBERT, which is typically a large language model, use a Python backend. Ensure the Python environment has transformers and tensorflow (or pytorch if you prefer for IndoBERT) installed and configured correctly.

Reason: IndoBERT is primarily designed for Python-based machine learning ecosystems, especially with the Hugging Face Transformers library.

Rule: Handle text preprocessing (tokenization, padding, attention masks) for IndoBERT on the backend before feeding it to the model. Use the appropriate tokenizer from the transformers library.

Reason: Ensures the input text is in the correct numerical format and dimensions required by the IndoBERT model.

TensorFlow.js Integration (Client-side):

Rule: When using TensorFlow.js, load models asynchronously and display loading indicators to the user. Optimize model size for web deployment by quantizing models or using smaller pre-trained versions where possible.

Reason: Improves user experience by preventing UI freezes during model loading and reduces initial page load times.

Rule: Consider using Web Workers for TensorFlow.js inference to avoid blocking the main UI thread, especially for longer-running predictions.

Reason: Enhances UI responsiveness during computation.

Environment Management (pnpm & Python):

Rule: Manage your Python dependencies for AI models separately using Python-specific tools like pipenv or conda, distinct from your pnpm-managed Node.js dependencies.

Reason: Keeps environments clean, avoids conflicts between JavaScript/Node.js and Python ecosystems, and ensures correct dependency resolution for each.

Error Handling & Fallbacks:

Rule: Implement robust error handling for AI model inference, including timeouts for API calls, and provide clear fallback mechanisms or informative messages to the user if the AI service is unavailable, returns unexpected results, or fails to process input.

Reason: Ensures application resilience, provides a graceful user experience, and aids in debugging.

Security for AI Endpoints:

Rule: Secure your AI API endpoints (if exposed via Next.js API routes) using authentication and authorization mechanisms (e.g., Supabase Auth tokens, API keys, or custom JWTs). Do not expose raw model files or sensitive inference logic directly to the client.

Reason: Prevents unauthorized access, protects your intellectual property, and safeguards against abuse of your AI models and associated data.

By adhering to these rules, you'll build a more stable, performant, and secure application within your specified development environment.