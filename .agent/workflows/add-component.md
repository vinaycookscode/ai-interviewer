---
description: Add a new shadcn/ui component
---

# Add UI Component

Install and configure a new shadcn/ui component.

## Steps

1. Add component (replace `button` with component name):
   ```bash
   npx shadcn@latest add button
   ```

2. Components are installed to `components/ui/`

## Available Components

Common components to add:
- `button` - Button component
- `card` - Card layout
- `dialog` - Modal dialogs
- `dropdown-menu` - Dropdown menus
- `input` - Form inputs
- `select` - Select dropdowns
- `table` - Data tables
- `tabs` - Tab navigation
- `toast` - Toast notifications
- `sheet` - Slide-out panels

## Multiple Components

Add multiple at once:
```bash
npx shadcn@latest add button card dialog
```

## Component Location
All shadcn components are in `@/components/ui/`
