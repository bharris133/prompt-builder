# Prompt Engineering Builder

_(This README will be updated as the project evolves)_

## Overview

This is a web-based tool designed to help users construct, test, refine, and manage prompts for Large Language Models (LLMs). It provides a visual, component-based interface for building prompts piece by piece, arranging them logically, and saving them for later use.

The goal is to create a powerful utility for anyone working frequently with LLMs, from crafting simple requests to engineering complex, multi-step prompt chains or agent instructions.

## Tech Stack

- **Framework:** Next.js (v14+ with App Router)
- **Language:** TypeScript
- **UI Library:** React
- **Styling:** Tailwind CSS
- **Drag & Drop:** `@dnd-kit` (Core, Sortable, Utilities)
- **Persistence:** Supabase (for user data, prompts, templates), localStorage (for quick saves)
- **Authentication:** Supabase Auth
- **Payments:** Stripe (subscription and billing)
- **Testing:** Vitest, React Testing Library, jest-dom
- **Linting/Formatting:** ESLint / Prettier (Recommended setup)

## Project Structure

- `src/app/`: Core application routes and UI components (Next.js App Router conventions)
- `src/lib/`: API clients (e.g., Supabase, Stripe)
- `src/app/context/`: React context providers (e.g., PromptContext)
- `public/`: Static assets
- `vitest.config.ts`, `vitest.setup.ts`: Automated test configuration
- `.env.local`: Environment variables (Supabase, Stripe, etc.)
- `tailwind.config.ts`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `next.config.mjs`: Next.js configuration
- `package.json`: Project dependencies and scripts

---

## Getting Started

1. **Prerequisites:**

   - Node.js (LTS version v18.x or v20.x recommended)
   - npm (comes with Node.js) or yarn

2. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

4. **Configure Environment Variables:**

   - Copy `.env.local.example` to `.env.local` and fill in your Supabase and Stripe keys.

5. **Run the Development Server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Current Features

- **Component-Based Building:** Add distinct prompt components:
  - Instruction
  - Context
  - Role
  - Example Input
  - Example Output
  - (More planned, e.g., Tools)
- **In-Place Editing:** Edit the content of each component directly within the canvas.
- **Drag & Drop Reordering:** Change the order of components using `@dnd-kit`.
- **Visual Styling:** Components are color-coded by type (Tailwind CSS).
- **Real-time Preview:** View the generated prompt, assembled from your components in order.
- **Copy to Clipboard:** Copy the final generated prompt text.
- **Named Prompt Saving:** Save the current set of components under a specific name to localStorage or Supabase.
- **Clear Canvas:** Reset the current workspace without deleting saved prompts.
- **Prompt & Template Management:** Modals for managing saved prompts and templates.
- **Provider Selection:** Choose between OpenAI, Anthropic, Google (Gemini) for prompt refinement.
- **API Key Management:** Securely enter and edit API keys for supported providers.
- **Variable Support:** Placeholders/variables within components.
- **LLM Integration:** Prompt analysis, suggestions, alternative phrasings.
- **UI/UX Refinements:** Tooltips, feedback messages, accessibility.
- **Advanced Persistence:** Supabase.
- **Authentication:** User sign up, login, and session management via Supabase.
- **Subscription & Billing:** Stripe integration for paid plans, including customer portal.
- **Automated Testing:** Vitest and React Testing Library for core UI logic.

## How it Works

- **Sidebar:** Add new component types, manage prompts/templates, select provider/model, and handle API keys.
- **Prompt Canvas:** Main area for displaying, editing, and reordering components.
- **Generated Prompt:** Section showing the final combined prompt text.
- **Header:** Controls for saving, loading, and managing prompts/templates.

## Testing

- **Automated:** Run `npm test` to execute Vitest unit/integration tests (see `src/app/components/Sidebar.test.tsx` for examples).
- **Manual UAT:** See the checklist below for critical user journeys to verify before deployment.

---

## Manual UAT Checklist

1. **Prompt Engineering Workflow**

   - Add, edit, reorder, and delete all component types.
   - Refine prompts using all supported providers and API key modes.
   - Save, load, and manage prompts/templates.
   - Import from shared library.

2. **Authentication & Account**

   - Sign up, log in, log out, session persistence.
   - User info displays correctly.

3. **Subscription & Billing**

   - Subscribe with Stripe test card.
   - Status updates and access control.
   - Manage/cancel subscription in Stripe portal.

4. **UI/UX & Responsiveness**
   - Test on desktop, tablet, mobile.
   - Sidebar and modals work on all screen sizes.
   - Light/dark mode, visual polish.

---

## Roadmap / Next Steps

- [ ] **Admin Features:** User, prompt, and template management (admin-only UI and backend enforcement).
- [ ] **Advanced Context Engineering:** Generate full context engineering prompts.
- [ ] **Template Management Enhancements:** More flexible template workflows.
- [ ] **Advanced MCP setup (nice-to-have):** Generate full MCP creation prompt Template.
- [ ] **Add more intelligence to prompt refinment process:** Find new way to improve the prompt refinment process.

---

_(This README will be updated as the project evolves)_
