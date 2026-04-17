---
description: Update project documentation when new files are created
---

# Update Documentation Workflow

When creating new files in the project, update the documentation in `.agent/allfileslisted/allfileslisted.md`.

## Steps

1. **Identify the file type** you just created:
   - Page/Route → Update "Pages/Routes" table
   - Component → Update "Components" table (core, ui, dashboard, or game)
   - Hook → Update "Hooks" table
   - Store → Update "State Stores" table
   - Utility → Update "Utilities & Libraries" table
   - Server Action → Update "Server Actions" table

2. **Add a new row** to the appropriate table with:
   - File path (relative to `src/`)
   - Brief description of what it does
   - For hooks: what it returns
   - For stores: key state values

3. **Update Quick Reference** if the new file is related to a common editing task

4. **Keep descriptions concise** - one line maximum

## Example

If you created `src/components/game/countdown-timer.tsx`:

```markdown
| CountdownTimer | countdown-timer.tsx | Visual countdown for game rounds |
```

Add this to the "Game Components" section.

## Automation Note

After creating any new `.tsx` or `.ts` file in `src/`, run this mental checklist:
- [ ] Is it a new route? Add to routes table
- [ ] Is it a new component? Add to components table
- [ ] Is it a new hook? Add to hooks table
- [ ] Is it a new utility? Add to utilities table
- [ ] Does it add a new database table? Add to database table
