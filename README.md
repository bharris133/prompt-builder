# Prompt Engineering Builder
*(This README will be updated as the project evolves)*

## Overview

This is a web-based tool designed to help users construct, test, refine, and manage prompts for Large Language Models (LLMs). It provides a visual, component-based interface for building prompts piece by piece, arranging them logically, and saving them for later use.

The goal is to create a powerful utility for anyone working frequently with LLMs, from crafting simple requests to engineering complex, multi-step prompt chains or agent instructions.

## Tech Stack

*   **Framework:** Next.js (v14+ with App Router)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Drag & Drop:** `@dnd-kit` (Core, Sortable, Utilities)
*   **Persistence:** Browser `localStorage` (for saving named prompts)
*   **Linting/Formatting:** ESLint / Prettier (Recommended setup)


## Project Structure (Initial)

*   `src/app/`: Contains the core application routes and UI components (using Next.js App Router conventions).
*   `public/`: Static assets.
*   `tailwind.config.ts`: Configuration for Tailwind CSS.
*   `tsconfig.json`: Configuration for TypeScript.
*   `next.config.mjs`: Configuration for Next.js.
*   `package.json`: Project dependencies and scripts.

---

## Getting Started

1.  **Prerequisites:**
    *   Node.js (LTS version v18.x or v20.x recommended)
    *   npm (comes with Node.js) or yarn

2.  **Clone the repository (if applicable):**
    ```bash
    # git clone <repository-url>
    # cd <repository-directory>
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
4.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Current Features (As of this version)

*   **Component-Based Building:** Add distinct prompt components:
    *   Instruction
    *   Context
    *   Role
    *   Example Input
    *   Example Output
    *   *(More planned, e.g., Tools)*
*   **In-Place Editing:** Edit the content of each component directly within the canvas.
*   **Drag & Drop Reordering:** Easily change the order of components using `@dnd-kit`.
*   **Visual Styling:** Components are color-coded by type (using Tailwind CSS) for better visual organization.
*   **Real-time Preview:** View the generated prompt, assembled from your components in order, updated instantly.
*   **Copy to Clipboard:** Quickly copy the final generated prompt text.
*   **Named Prompt Saving:** Save the current set of components under a specific name to the browser's `localStorage`. Handles overwriting existing names with confirmation.
*   **Clear Canvas:** Reset the current workspace without deleting saved prompts.
*   **(Partially Implemented):** Sidebar dropdown lists saved prompt names (loading functionality is the next step).


## How it Works (High Level)

*   **Sidebar:** Contains buttons to add new component types to the canvas and (soon) a dropdown to load/manage saved prompts.
*   **Prompt Canvas:** The main area where components are displayed, edited, and reordered via drag-and-drop.
*   **Generated Prompt:** A section below the canvas showing the final combined prompt text based on the components and their order.
*   **Header:** Includes controls for saving the current canvas state with a name.

## Roadmap / Next Steps

*   [ ] **Implement Load Functionality:** Activate the dropdown to load selected saved prompts onto the canvas.
*   [ ] **Implement Delete Saved Prompt:** Add a way to remove prompts from `localStorage`.
*   [ ] **Add "Tools" Component:** Introduce a new component type for defining tools/functions for agents or function-calling scenarios.
*   [ ] **Refactor Code Structure:** Break down the large `page.tsx` into smaller, reusable components and potentially custom hooks for state management (e.g., `Sidebar`, `PromptCanvas`, `GeneratedPrompt`, `usePromptManager`).
*   [ ] **LLM Integration:** Integrate with an LLM API (e.g., OpenAI) for features like:
    *   Prompt analysis and suggestions.
    *   Generating alternative phrasings.
*   [ ] **Template Management:** Allow saving/loading structures as reusable templates.
*   [ ] **Variable Support:** Implement placeholders/variables within components.
*   [ ] **UI/UX Refinements:** Continuously improve usability, add tooltips, better feedback messages, etc.
*   [ ] **Advanced Persistence:** Explore options beyond `localStorage` if needed later.

---
*(This README will be updated as the project evolves)*