# Theme notes — Midnight Draft (alt-dark) & Light

## Midnight Draft (alt-dark)
**Character:** A higher-contrast, near-black sibling to Open Commons — canvas drops to `#050505`, text pushed lighter, amber brightened to `#f0983f` so wayfinding stays legible against the deeper ground. Reads more like a late-night research tool than lamplight.

Contrast ratios (WCAG relative luminance):
| pair | ratio |
|---|---|
| body text / canvas | 14.33:1 |
| body text / surface | 13.81:1 |
| body text / raised surface | 13.01:1 |
| title (strong) / canvas | 18.74:1 |
| link / canvas | 9.00:1 |
| link / surface | 8.67:1 |
| mono metadata (warm) / raised | 9.48:1 |
| muted caption / canvas | 6.75:1 |
| faint (deliberately low) / canvas | 4.58:1 |
| teal / functionalism surface | 8.57:1 |
| rose / conflict surface | 7.47:1 |
| amber / interactionism surface | 7.97:1 |

No token resisted theming — all overrides use existing token names.

## Light
**Character:** The daylight sibling of Open Commons — warm paper (`#f5efe4`) with dark ink, same reading-first, quietly-technical personality, not a generic light mode.

**Derived accent:** the shipped `#e08a3c` measures **2.33:1** on `#f5efe4` paper — fails text contrast outright. Derived `#8a4a15` (**5.98:1**) for text-sized accent/link uses, and `#7c4212` (**6.94:1**) for the bolder "strong" role. Both keep the amber hue family recognizable while clearing 4.5:1.

Contrast ratios:
| pair | ratio |
|---|---|
| body text / canvas | 11.29:1 |
| body text / surface | 12.10:1 |
| body text / raised surface | 12.71:1 |
| title (strong) / canvas | 14.56:1 |
| link (derived amber) / canvas | 5.98:1 |
| link / surface | 6.40:1 |
| mono metadata (warm) / raised | 7.26:1 |
| muted caption / canvas | 5.06:1 |
| faint (deliberately low) / canvas | 3.07:1 |
| teal / canvas | 5.59:1 |
| teal / functionalism surface | 5.65:1 |
| rose / conflict surface | 4.97:1 |
| amber / interactionism surface | 5.84:1 |

**Shadows:** rebuilt as warm, low-opacity lifts (`rgba(120,90,40, …)`) rather than copied dark-mode values, which would read as flat gray smudges on paper.

No token resisted theming — all overrides use existing token names; nothing new was added.
