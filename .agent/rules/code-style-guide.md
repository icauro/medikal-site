# Medikal-Site Code Style Guide

This project follows a strict set of coding standards to maintain consistency and quality across the codebase.

## 1. General Conventions
- **Language**: Always use **TypeScript** (.ts, .tsx). Avoid using plain JavaScript.
- **Indentation**: 2 spaces.
- **Quotes**: Use **double quotes** (`"`) for strings, especially in JSX and component code.
- **Semicolons**: Always use semicolons (`;`) at the end of statements.
- **Trailing Commas**: Use trailing commas in multi-line objects, arrays, and function parameters.
- **Line Length**: Keep lines within a reasonable length (max 120 characters recommended).

## 2. Naming Conventions
- **Components**: Use `PascalCase` (e.g., `ListingCard.tsx`, `Navbar.tsx`).
- **Files/Directories**:
    - App Router directories: `kebab-case` (e.g., `medical-facilities`, `add-review`).
    - Utility/Logic files: `camelCase` or `kebab-case` (e.g., `utils.ts`, `supabase.ts`).
    - Test files: `[Filename].test.tsx` or `[filename].test.ts`.
- **Variables/Functions**: Use `camelCase`.
- **Constants**: Use `UPPER_SNAKE_CASE` for global constants.

## 3. React & Next.js
- **Framework**: Next.js App Router.
- **Functional Components**: Use functional components with `export default function` for pages and layouts.
- **Component Structure**:
    - Imports (standard, then external, then local).
    - Interfaces/Types for props.
    - Component logic.
    - JSX returned.
- **Styling**: Use **Tailwind CSS** for all styling. Use the `className` attribute.
- **Path Aliases**: Use `@/` for imports from the root directory (e.g., `import { ... } from "@/lib/utils"`).

## 4. TypeScript Usage
- **Strict Typing**: Avoid using `any`. Define interfaces or types for all data structures.
- **Props**: Use `Readonly<{ ... }>` for component props when appropriate.
- **Exports**: Prefer `export default` for main components in a file, and named exports for utilities/constants.

## 5. Documentation & Comments
- **JSDoc**: Use JSDoc comments for all utility functions, explaining parameters and return values.
- **Comments**: Write clear, concise comments for complex logic. Avoid commenting on obvious code.

## 6. Testing
- **Framework**: Vitest.
- **Library**: React Testing Library.
- **Organization**: Keep test files in the same directory as the source file.

---
*Note: This guide is automatically enforced and should be followed for all contributions.*
