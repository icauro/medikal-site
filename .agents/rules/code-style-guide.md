# Medikal-Site Code Style Guide

This project follows a strict set of coding standards to maintain consistency and quality across the codebase.

**Related Documents:**
- [External Library Usage Guide](./external-library-usage.md) - Required libraries and how to use them
- [Documentation Synchronization](#7-documentation-synchronization) - Keep docs in sync with code

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

## 7. Documentation Synchronization
Design documentation and codebase must remain synchronized at all times. Code changes and design doc updates must be submitted together in the same PR/commit.

### Code-to-Documentation Mapping

| Code Area | Documentation File | Update Trigger |
|-----------|-------------------|-----------------|
| Database schema, migrations | `docs/TechnicalGuides/database/supabase_schema.sql` | Schema migration files added/modified |
| Database architecture | `docs/TechnicalGuides/database/supabase_integration.md` | New tables, columns, RLS policies |
| Signup/auth flow | `docs/SIGNUP_FLOW_DIAGRAM.md`, `docs/TechnicalGuides/architecture/signup_flow.md` | Auth logic, role selection, flow changes |
| API routes | `docs/TechnicalGuides/api/` | New or modified `app/api/` routes |
| Page structure/routing | `docs/TechnicalGuides/architecture/pages_overview.md` | New routes, page layouts, navigation |
| User roles/permissions | `docs/TechnicalGuides/architecture/roles.md` | Role definitions, permission changes |
| Theme/styling tokens | `docs/TechnicalGuides/architecture/theme_config.md` | Tailwind config, color scheme, spacing changes |
| Component architecture | `docs/TechnicalGuides/architecture/modal_architecture.md` | New modal patterns, component structures |
| Environment config | `docs/TechnicalGuides/setup/environment_variables.md` | New env variables, config changes |
| Storage/upload features | `docs/CLOUDFLARE_R2_SETUP.md`, `docs/R2_QUICK_REFERENCE.md` | R2 integration, image handling changes |
| Database logging | `docs/TechnicalGuides/database/database_logging.md` | Logging setup, monitoring changes |

### When to Update Documentation

- **Schema migrations**: Update `docs/TechnicalGuides/database/supabase_schema.sql` with DDL changes
- **New API endpoints**: Document endpoints, parameters, and responses in `docs/TechnicalGuides/api/`
- **New pages/routes**: Update `docs/TechnicalGuides/architecture/pages_overview.md` with route paths and purposes
- **Permission/role changes**: Update `docs/TechnicalGuides/architecture/roles.md` with new roles or policy changes
- **Config changes**: Update `docs/TechnicalGuides/setup/environment_variables.md` with new variables
- **Breaking changes**: Document migration steps in affected architecture files
- **New features**: Add feature overviews to the relevant technical guide

### Documentation Review Checklist

Before submitting a PR with code changes, verify:
- [ ] No schema changes without updating `docs/TechnicalGuides/database/`
- [ ] No new routes without updating relevant architecture docs
- [ ] No permission/role changes without updating `docs/TechnicalGuides/architecture/roles.md`
- [ ] No new environment variables without updating `docs/TechnicalGuides/setup/environment_variables.md`
- [ ] Breaking changes documented with migration instructions
- [ ] Diagrams (e.g., `SIGNUP_FLOW_DIAGRAM.md`) updated if logic changes

---
*Note: This guide is automatically enforced and should be followed for all contributions.*