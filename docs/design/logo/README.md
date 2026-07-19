# Logo assets

Open Commons identity. The mark is a three-node triangle with connecting
edges — the concept graph the project is built on, at its smallest honest size.

| File | Use |
|---|---|
| `logo-lockup.svg` | Mark + wordmark. The shell top bar (28px height). Default choice wherever there is horizontal room. |
| `logo-mark.svg` | Mark alone, on the dark canvas. Square contexts: avatars, social cards, favicons at large sizes. |
| `logo-mark-mono.svg` | Single-colour mark. Use where the palette is not available or the background is unknown — stamps, embroidery, one-colour print. |
| `favicon-32.png`, `favicon-16.png` | Browser tab icons. Wired up in `src/app/layout.tsx` via Next metadata `icons`. |

Usage notes:

- Colours are the token palette (`--color-text-heading` strokes on
  `--color-canvas`). The SVGs carry literal hexes because they are assets, not
  app source — the hex-literal guard covers app code only.
- Clear space: at least the height of one node circle on every side.
- Minimum lockup width 160px; below that use the mark alone.
- Do not recolour the mark to amber. Amber is wayfinding (direction rule 3);
  the identity is ink-on-dark.
- Copies of the lockup and mark are served from `public/` — the files here are
  the source of truth, `public/` is the deployment copy.
