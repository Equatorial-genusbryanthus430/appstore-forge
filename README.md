# AppStore Forge

A Mac app that turns raw app screenshots into store-ready App Store and Google
Play assets. Drop PNGs in, pick a background and a device frame, write a headline
per screen, save the folder.

No account, no upload, no server — the images never leave the machine.

## Install it

```bash
pnpm install
pnpm install:app     # build, install to /Applications, launch
```

Or `pnpm dist` for just the `.dmg`.

That produces `release/AppStore Forge-<version>-arm64.dmg`. Open it, drag the app
to Applications, done. From then on it is a normal Mac app — no terminal, no dev
server.

The build is unsigned. Because you built it locally macOS does not quarantine
it, so it opens normally. If you ever copy the `.dmg` to another Mac it will need
a right-click → Open the first time.

| Command | What it does |
| --- | --- |
| `pnpm dist` | Installable `.dmg` |
| `pnpm app` | Unpacked `.app` in `release/mac-arm64/` — faster, for trying changes |
| `pnpm electron:dev` | App window with hot reload, for development |
| `pnpm dev` | Plain browser version on :4324 |

## How it works

The one design decision everything else follows from: **the preview and the
export run the same code**.

`src/render/scene.ts` exposes a single `renderScene(ctx, w, h, screen, settings, img)`.
The preview calls it at ~230px wide; the export calls it at 1320×2868. Nothing is
re-implemented between the two, so what is on screen is exactly what lands on
disk — no CSS-to-canvas translation layer to drift out of sync.

Device frames are drawn with canvas primitives from a geometric description
(screen aspect, bezel thickness, corner radius, notch kind) in
`src/presets/devices.ts`. There are no bitmap frame assets to ship, scale, or
license, and adding a device is a five-line object.

```
electron/main.cjs     window, native folder picker, file writes, Finder reveal
electron/preload.cjs  context-isolated bridge exposed as window.desktop
src/
  render/scene.ts     the renderer — background, text block, device placement
  render/frames.ts    device body, bezel, screen clip, Dynamic Island / punch-hole
  presets/            backgrounds, devices, layouts, templates (looks), store export sizes
  lib/export.ts       renders every screen full-size, then saves or zips
  store.ts            zustand: screens, decoded images, settings
samples/              four fake app screenshots for trying it out
_context/             domain model, invariants, and workflows — read before changing code
```

## Export

Export opens a native folder picker, writes the PNGs into
`<chosen>/store-screenshots-<size-id>/`, and reveals the folder in Finder. The
same build running in a plain browser has no filesystem, so it falls back to a
zip download.

Only the largest device per family is required — both stores downscale for the rest.

| Store | Target | Pixels |
| --- | --- | --- |
| App Store | iPhone 6.9" | 1320 × 2868 |
| App Store | iPhone 6.5" | 1242 × 2688 |
| App Store | iPad 13" | 2064 × 2752 |
| Google Play | Phone | 1080 × 1920 |
| Google Play | Tablet | 1600 × 2560 |

**Alpha channel:** App Store Connect rejects images carrying an alpha channel,
and canvas always writes RGBA for PNG even when every pixel is opaque. If an
upload is refused, flip the format toggle to JPEG and re-export.

## Automation

The zustand store is exposed as `window.__store`, in packaged builds too, so an
agent driving the app over CDP (Argent, Playwright) or the devtools console can
script it:

```js
await window.__store.getState().addFiles([file])
window.__store.getState().setSettings({ layout: 'bleed', sizeId: 'android-phone' })
```

`window.desktop` exposes the Electron bridge — `chooseFolder`, `writeFiles`,
`revealPath` — so an agent can write an export without touching the native dialog.

## Not built yet

- Pulling screenshots straight off a booted simulator/emulator via Argent
- Exporting every required size in one pass
- Per-screen background and layout overrides
- Persisting a project between reloads
- Auto-update (it is a local build; rebuild to update)
