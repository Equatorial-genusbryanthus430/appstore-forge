# Domain

## The problem

Shipping a mobile app means producing 5–10 marketing screenshots per store, per
device family, every release. The raw captures from a simulator are not
acceptable as-is — stores expect framed, captioned, designed images at exact
pixel sizes. Doing this by hand in Figma each release is the pain this app
exists to remove.

The important consequence: **the second release matters more than the first.**
Anything that makes re-doing a set cheap is worth more than another styling
option.

## Vocabulary

| Term | Meaning |
| --- | --- |
| **Screen** | One output image. Owns a source screenshot, a headline, a subtitle, and its overrides. |
| **Source screenshot** | The raw PNG the user dropped in. Never modified — only drawn into a device frame. |
| **Settings** | The global look: background, device, layout, arrangement, type, tilt, scale, export size. |
| **Override** | A setting pinned on one Screen. Absent key = inherit from Settings. |
| **Device frame** | The phone/tablet body drawn around a source screenshot. Pure geometry, no bitmaps. |
| **Layout** | Where the text band and device band sit vertically. |
| **Arrangement** (position) | How many device frames appear and where. May pull in neighbouring Screens. |
| **Template** | A complete look: a Settings preset plus per-screen **variants**. A template *with* variants is a **set template**: it has a fixed number of **slots** (one per variant) that are laid out the moment it is chosen. A template without variants (Classic) is **freeform** — any number of screens. |
| **Slot** | A Screen created by a set template. `imageId: null` while unfilled; it previews with the drawn placeholder and carries the template's sample copy. Export is gated until every slot is filled. |
| **Highlight** | A marker band drawn behind `*starred*` words in a headline. Spans cycle through `settings.highlights`. |
| **Backdrop** | A rounded card drawn behind the device band, between background and text. |
| **Export size** | Target canvas in pixels. Global — a set cannot mix sizes. |

## Data model

```ts
Screen   = { id, headline, subhead, imageId, overrides: Partial<Settings> }
Settings = { background, backdropColor, deviceId, frameColorId, positionId, layout,
             tilt, deviceScale, textColor, textAlign, highlights, fontId,
             headlineScale, subheadScale, headlineTracking, sizeId }
Template = { id, label, settings: Partial<Settings>, variants?: ScreenOverrides[], sample }
```

Headlines carry light markup: `*word*` highlights the word. `parseMarkup` in
`render/scene.ts` is the only parser; `stripMarkup` feeds filenames.

Applying a template (`applyTemplate` in the store) is `DEFAULT_SETTINGS` +
`template.settings`, keeping the user's `sizeId` and `deviceId`. A set template
then lays out `max(slots, filledScreens)` screens: screens that already hold an
image are kept (with `overrides = variants[i]`), the rest are empty slots with the
template's sample copy. A freeform template drops empty slots. `addFiles` fills
empty slots in order before appending; `setImage` fills one slot; `clearImage`
empties it without removing it. Variant overrides are ordinary overrides — they
travel with the screen when reordered and reset like any other.

Resolution is `{ ...settings, ...screen.overrides }`, computed in exactly one
place: the top of `renderScene`. `sizeId` is excluded from `ScreenOverrides` at
the type level — a set must share one canvas size.

## Architecture

```
electron/main.cjs     window, native folder picker, file writes, Finder reveal
electron/preload.cjs  context-isolated bridge → window.desktop
src/render/scene.ts   THE renderer: background → text → device placements
src/render/frames.ts  device body, bezel, screen clip, Dynamic Island / punch-hole
src/presets/          backgrounds, devices, fonts, layouts, templates, positions, sizes
src/render/placeholder.ts  drawn stand-in screenshot for template thumbnails
src/lib/settings.ts   override resolution + section grouping
src/lib/export.ts     full-size render → native save, or zip in a browser
src/store.ts          zustand: screens, decoded images, settings, selection, page
src/components/TopBar.tsx        window drag strip + Templates / Editor tabs
src/components/TemplatesPage.tsx gallery of looks; choosing one applies it and opens the editor
```

### The one decision everything rests on

`renderScene(ctx, w, h, screen, settings, sources)` draws the preview at ~230px
and the export at 1320×2868. Same function, same call, only `w`/`h` differ.

There is deliberately **no second rendering path**. Any feature added as
CSS-in-the-preview would immediately drift from the export and reintroduce the
"looked right in the app, wrong in the PNG" failure this design exists to
prevent.

### Device frames are drawn, not imported

A device is a geometric description — screen aspect, bezel fraction, corner
radius fraction, notch kind — rendered with canvas primitives. No bitmap assets
to scale or license, and adding a device is a one-line object in
`presets/devices.ts`.

## Store constraints worth knowing

- Only the largest device per family is required; stores downscale for the rest.
- App Store Connect **rejects images carrying an alpha channel**. Canvas always
  writes RGBA for PNG even when fully opaque — hence the JPEG toggle.
- Google Play: 2–8 phone screenshots, max 2:1 aspect.
