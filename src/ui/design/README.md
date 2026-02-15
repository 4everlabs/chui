# Design System

`src/ui/design/` is the terminal UI equivalent of a global CSS layer.

Use this folder for:
- Design tokens (`tokens.ts`) like colors, spacing, and sizing scales.
- Runtime viewport constraints (`tokens.ts` + `viewport.ts`) like minimum supported terminal size.
- Semantic style mappings (`text.ts`, `components.ts`) that convert tokens into reusable variants.
- A single import surface (`index.ts`) for app-wide style usage.

Recommended workflow:
1. Add or update tokens first (`tokens.ts`).
2. Map tokens to semantic variants (`text.ts`, `components.ts`).
3. Consume variants from primitives in `src/ui/primitives/`.
4. Compose feature screens in `src/ui/screens/`.

This keeps your visual language centralized and avoids hardcoded styles in feature screens.
