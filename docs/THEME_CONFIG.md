# Medikal Portal Theme Configuration

## Overview
All color schemes and styling for the Medikal Portal are centralized in a single theme configuration file. This ensures consistency across the entire application and makes it easy to update colors globally.

## Theme File Location
**File**: [lib/theme.ts](../lib/theme.ts)

## Theme Structure

The theme exports a `theme` object with the following sections:

### 1. **Colors** - Hex color values
```typescript
theme.colors.primary.green      // #10b981
theme.colors.primary.blue       // #0ea5e9
theme.colors.background.darkest // #0a1929
theme.colors.text.primary       // #ffffff
theme.colors.status.success     // #10b981
```

### 2. **Gradients** - Gradient definitions
```typescript
theme.gradients.pageBackground  // CSS linear-gradient string
theme.gradients.pageBgClasses   // Tailwind classes
theme.gradients.heroText        // Hero heading gradient
theme.gradients.logo            // Logo gradient
```

### 3. **Components** - Pre-built component class groups
```typescript
theme.components.navbar         // All navbar styling classes
theme.components.footer         // All footer styling classes
theme.components.button         // Button styling variants
theme.components.input          // Input field styling
```

### 4. **CSS Variables** - For use in pure CSS/SCSS
```typescript
theme.cssVariables['--primary-green']  // '#10b981'
theme.cssVariables['--primary-blue']   // '#0ea5e9'
```

## How to Use

### In React Components (TypeScript/TSX)

**Import the theme:**
```typescript
import { theme } from "@/lib/theme";
```

**Use component styles:**
```tsx
export default function MyComponent() {
  return (
    <div className={`${theme.components.navbar.background} ${theme.components.navbar.border}`}>
      <h1 className={theme.components.navbar.logoGradient}>My App</h1>
      <a className={`${theme.components.navbar.text} ${theme.components.navbar.textHover}`}>
        Link
      </a>
    </div>
  );
}
```

**Use individual colors:**
```tsx
import { theme } from "@/lib/theme";

const buttonStyle = {
  backgroundColor: theme.colors.primary.green,
  color: theme.colors.text.primary,
};
```

**Use gradients:**
```tsx
<div className={theme.gradients.pageBgClasses}>
  <h1 className={theme.gradients.heroText}>Title</h1>
</div>
```

### In CSS Files

Use CSS variables defined in [app/globals.css](../app/globals.css):

```css
.my-element {
  background-color: var(--primary-green);
  border-color: var(--primary-blue);
}

.my-gradient {
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--primary-blue) 100%);
}
```

## Currently Themed Components

The following components now use the centralized theme:

- ✅ [app/components/Navbar.tsx](../app/components/Navbar.tsx)
- ✅ [app/components/Footer.tsx](../app/components/Footer.tsx)
- ✅ [app/page.tsx](../app/page.tsx) (Home page)

### Components to Update
The following still use hardcoded colors and should be updated:

- [ ] [app/about/page.tsx](../app/about/page.tsx)
- [ ] [app/blogs/page.tsx](../app/blogs/page.tsx)
- [ ] [app/treatment-plan/page.tsx](../app/treatment-plan/page.tsx)
- [ ] [app/support/page.tsx](../app/support/page.tsx)
- [ ] [app/profile/page.tsx](../app/profile/page.tsx)
- [ ] [app/login/page.tsx](../app/login/page.tsx)
- [ ] [app/add-review/page.tsx](../app/add-review/page.tsx)
- [ ] [app/healthcare-database/page.tsx](../app/healthcare-database/page.tsx)
- [ ] Dynamic pages: [slug]/page.tsx files
- [ ] Admin pages: [app/admin/](../app/admin/)

## Updating the Theme

### To Change Colors
Edit [lib/theme.ts](../lib/theme.ts) and update the `colors` object:

```typescript
export const theme = {
  colors: {
    primary: {
      green: '#YOUR_NEW_GREEN',
      blue: '#YOUR_NEW_BLUE',
      // ... other colors
    },
    // ...
  },
};
```

### To Change Component Styles
Update the `components` section in [lib/theme.ts](../lib/theme.ts):

```typescript
components: {
  navbar: {
    background: 'bg-your-color',
    border: 'border-your-color',
    // ...
  },
},
```

### To Add New Component Styles
Add a new entry to the `components` object:

```typescript
components: {
  // ... existing components
  card: {
    background: 'bg-blue-900/30',
    border: 'border-green-500/20',
    shadow: 'shadow-lg',
  },
},
```

Then use it in components:
```tsx
<div className={`${theme.components.card.background} ${theme.components.card.border}`}>
  Card content
</div>
```

## Color Palette Reference

### Primary Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary Green | #10b981 | Links, hovers, accents |
| Primary Blue | #0ea5e9 | Secondary elements |
| Light Green | #34d399 | Highlights, gradients |
| Light Blue | #38bdf8 | Secondary highlights |

### Background Colors
| Name | Hex | Usage |
|------|-----|-------|
| Darkest | #0a1929 | Page edges |
| Dark | #0f2942 | Primary bg |
| Medium | #1a3a52 | Secondary bg |
| Surface | #1e4d6b | Cards, sections |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | #ffffff | Main text |
| Secondary | #e5e7eb | Secondary text |
| Muted | #9ca3af | Disabled, hints |

## Syncing Theme with Globals CSS

The CSS custom properties in [app/globals.css](../app/globals.css) are synchronized with [lib/theme.ts](../lib/theme.ts). Always update both files when changing colors:

**lib/theme.ts:**
```typescript
colors: {
  primary: {
    green: '#10b981',
  },
},
```

**app/globals.css:**
```css
:root {
  --primary-green: #10b981;
}
```

## TypeScript Support

The theme is fully typed with TypeScript. The `Theme` type is exported for use in custom hooks or utilities:

```typescript
import { type Theme } from "@/lib/theme";

function useTheme(): Theme {
  // ... custom hook implementation
}
```

## Best Practices

1. **Always use the theme file** - Never hardcode colors directly in components
2. **Import at component level** - Import theme in components that need it
3. **Use component groups** - When styling related elements, use pre-built component style groups
4. **Keep CSS variables in sync** - If you update colors, update both the TS file and globals.css
5. **Create new component styles** - If a component type needs consistent styling, add it to the theme
6. **Document color changes** - Update this file when you add or modify colors

## Example: Updating All Buttons to Use Theme

**Before:**
```tsx
<button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2">
  Click me
</button>
```

**After:**
```tsx
import { theme } from "@/lib/theme";

<button className={`${theme.components.button.primary} text-white px-4 py-2`}>
  Click me
</button>
```

Now if you need to change the button color globally, you only update [lib/theme.ts](../lib/theme.ts).
