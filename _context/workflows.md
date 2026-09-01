# Workflows

## Adding a device frame

`src/presets/devices.ts` — one object:

```ts
{ id: 'pixel-10', label: 'Pixel 10', group: 'Android',
  screenAspect: 1280 / 2856, bezel: 0.026, radius: 0.085, notch: 'punch' }
```

`bezel` and `radius` are fractions of the **outer frame width**. `frameAspect()`
derives the outer ratio; nothing else needs touching. Give families distinct
character — Pixels rounder, Samsungs squarer with thinner bezels, budget phones
thicker — or the picker feels fake.

## Adding a setting

1. Add the key to `Settings` in `types.ts`. It becomes overridable automatically
   unless it must be global (like `sizeId`, excluded via `OverridableKey`).
2. Default it in `DEFAULT_SETTINGS` in `store.ts`.
3. Consume it in `renderScene`.
4. Add the control to `TunePanel.tsx` using `settings.<key>` to read and `put({...})`
   to write — `put` routes to the selected screen or the global scope. If the
   setting is a first-order decision (like store size), it belongs in a step
   instead (`components/steps/`).
5. List the key in `SECTION_KEYS` in `lib/settings.ts` so the section's override
   dot and "Reset to all screens" link know about it.

Do not add a bespoke per-screen field. That was the original `tilt: number | null`
mistake; overrides replaced it.

## Adding a layout

`src/presets/layouts.ts`. Vertical values are fractions of the tile height;
horizontal ones of the *composition* width (`tile × span`). Leave `device.width`
out to fit the band (the classic behaviour); set it, plus `cx`/`cy`, for a
Goldie-style absolute placement (`hero`, `panorama`). `text.left`/`text.width`
put the copy somewhere other than the padded tile — a panorama keeps it on the
left tile. Nothing else needs touching: preview, gallery strips, the store page
and export all read `span` from the layout.

## Adding a rhythm

`src/presets/rhythms.ts` — a list of `STEP`s (layout + arrangement + alignment).
The picker's glyph is drawn from `composeDevices`, the same geometry the
renderer uses, so a new step needs no artwork. A set template whose variants
follow a built-in rhythm names it in `rhythm`; otherwise its own compositions
appear in the picker as "<Template> (template)".

## Adding an arrangement

`src/presets/positions.ts`. Placements draw back to front. `dx`/`dy` are offsets
from the slot centre as fractions of canvas width/height. `source` picks which
screenshot fills that frame — `'self' | 'next' | 'prev'` — and indices wrap, so a
multi-device arrangement still works with one screen loaded.

Watch the edges: flanking devices bleeding off-canvas is fine, but cutting into
legible content in the neighbouring screenshot is not.

## Adding a template

`src/presets/templates.ts` — one object. `settings` is laid over `DEFAULT_SETTINGS`
(a template is a reset, so only list what differs). `variants` is optional; when
present, screen `i` is pinned to `variants[i % n]`. Any key in `Settings` except
`sizeId` / `deviceId` works in both. If the look needs geometry that no layout
provides, add a layout in `presets/layouts.ts` first — never special-case a
template inside `renderScene`.

`variants.length` is the slot count — a set template with five variants opens
five slots. `samples[i]` is the copy an unfilled slot `i` shows (and `samples[0]`
is the gallery thumbnail), so give one sample per variant. Use `*stars*` in them
if the highlight colours are part of its character. Omit `variants` for a
freeform template.

## Adding a step or a readiness rule

The rail, footer and Review step all read `readiness()` in `lib/progress.ts`;
add a rule there and every surface picks it up. A new step is a `StepId` in
`store.ts`, a component in `components/steps/`, a title in `Rail.tsx` and a
"Next" label in `Footer.tsx`. Keep it navigable — no step may block another.

## Automation hooks

Exposed in packaged builds too — this is a local tool with no untrusted content,
and scripting it is a feature.

```js
window.__store                  // the zustand store; __store.getState().setStep('review') jumps steps
window.__renderExport(screens, settings, images, 'png')
                                // the real export renderer, no native dialog
window.desktop                  // { platform, chooseFolder, writeFiles, revealPath }
```

Load images without faking drag-and-drop:

```js
const blob = await new Promise(r => canvas.toBlob(r))
await window.__store.getState().addFiles([new File([blob], 'x.png', { type: 'image/png' })])
```

## Verifying a visual change

Drive the packaged app over CDP:

```
boot-device { electronAppPath: "release/mac-arm64/AppStore Forge.app", force: true }
```

`force: true` matters — a stale instance with leftover state will otherwise be
reused and you will verify the wrong thing.

Then:
1. Load synthetic screens with **visually distinct** content (different header
   colours and words). You cannot tell which screenshot landed in which frame if
   they all look alike — this is what catches multi-device arrangements
   repeating one image.
2. Screenshot after each change. Judge from the image, not the DOM.
3. For anything touching output pixels, prove it with `__renderExport`: hash the
   bytes before and after, confirm the target screen changed **and** the others
   are byte-identical.

## Known trap: canvas fonts

If a headline renders in the wrong typeface only in the export, the font was not
loaded before `ctx.font` used it. Check:

```js
document.fonts.check('700 100px "Poppins"')   // must be true
```

and compare `measureText` width against a monospace baseline — equal widths mean
it fell back.

## Release checklist

```bash
pnpm typecheck
pkill -f "AppStore Forge.app"; sleep 1
pnpm version patch --no-git-tag-version
pnpm install:app
```

Then confirm the bundle: `CFBundleShortVersionString` matches, the sidebar
subtitle shows the new version, and the DMG in `release/` is named for it.
