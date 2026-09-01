<h1 align="center">AppStore Forge</h1>

<p align="center">
  Turn raw app screenshots into store-ready App Store and Google Play assets.<br>
  A local Mac app. No account, no upload, no server — the images never leave your machine.
</p>

<p align="center">
  <a href="https://github.com/hebertporto/appstore-forge/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/hebertporto/appstore-forge/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20(Apple%20Silicon)-lightgrey.svg">
</p>

<p align="center">
  <img src="docs/demo.gif" alt="Walking through the six steps: choosing a store target, picking a look, dropping in screenshots, writing headlines, fine-tuning, and reviewing the finished set" width="820">
</p>

---

Drop your PNGs in, pick a background and a device frame, write a headline per
screen, save the folder. Six steps, and the app tells you at every point what is
still missing before the set can be uploaded.

- **Frames without artwork.** Devices are drawn with canvas primitives from a
  geometric description, so there are no bitmap assets to ship, scale, or
  license — and adding a phone is a five-line object.
- **What you see is what ships.** The preview and the export call the same
  renderer. There is no CSS-to-canvas translation layer to drift out of sync.
- **Panoramas.** A composition can span two store tiles and gets sliced into
  consecutive PNGs on export.
- **Rhythms.** Vary the composition across the strip — a panorama opener, a hero,
  an offset, a breather — instead of ten identical tiles.
- **Nothing leaves the machine.** No network calls at all.

## Install

Grab the `.dmg` from [Releases](https://github.com/hebertporto/appstore-forge/releases),
or build it yourself:

```bash
pnpm install
pnpm install:app     # build, install to /Applications, launch
```

Either way it becomes a normal Mac app — no terminal, no dev server.

Builds are **unsigned**. One you built locally opens normally; a downloaded one
needs a right-click → **Open** the first time. macOS only, Apple Silicon, for
now — the web build (`pnpm dev`) runs anywhere and does everything except the
native folder picker.

| Command             | What it does                                                         |
| ------------------- | -------------------------------------------------------------------- |
| `pnpm install:app`  | Build, install to `/Applications`, launch                            |
| `pnpm dist`         | Installable `.dmg` in `release/`                                     |
| `pnpm app`          | Unpacked `.app` in `release/mac-arm64/` — faster, for trying changes |
| `pnpm electron:dev` | App window with hot reload, for development                          |
| `pnpm dev`          | Plain browser version on `:4324`                                     |

## How it works

The one design decision everything else follows from: **the preview and the
export run the same code.**

`src/render/scene.ts` exposes a single
`renderScene(ctx, w, h, screen, settings, sources)`. The preview calls it at
~230px wide; the export calls it at 1320×2868. Nothing is re-implemented between
the two, so what is on screen is exactly what lands on disk.

```
electron/main.cjs      window, native folder picker, file writes, Finder reveal
electron/preload.cjs   context-isolated bridge exposed as window.desktop
src/
  render/scene.ts      the renderer — background, backdrop, device placement
  render/text.ts       markup, line breaking, auto-shrink, marker bands
  render/frames.ts     device body, bezel, screen clip, Dynamic Island / punch-hole
  presets/             devices, backgrounds, fonts, layouts, rhythms, templates, sizes
  components/steps/    one file per step of the guided flow
  components/tune/     one file per section of the fine-tune panel
  lib/export.ts        renders every screen full-size, then saves or zips
  store.ts             zustand: screens, decoded images, settings
samples/               four fake app screenshots for trying it out
_context/              domain model, invariants, and workflows — read before changing code
```

### Headline markup

Wrap words in stars to give them a marker band: `Everything in *one place*`.
Spans cycle through the highlight colours, so a second `*starred*` phrase picks
up the second colour.

## Export

Export opens a native folder picker, writes the PNGs into
`<chosen>/store-screenshots-<size-id>/`, and reveals the folder in Finder. The
same build running in a plain browser has no filesystem, so it falls back to a
zip download.

Only the largest device per family is required — both stores downscale for the rest.

| Store       | Target      | Pixels      |
| ----------- | ----------- | ----------- |
| App Store   | iPhone 6.9" | 1320 × 2868 |
| App Store   | iPhone 6.5" | 1242 × 2688 |
| App Store   | iPad 13"    | 2064 × 2752 |
| Google Play | Phone       | 1080 × 1920 |
| Google Play | Tablet      | 1600 × 2560 |

> **Alpha channel.** App Store Connect rejects images carrying an alpha channel,
> and canvas always writes RGBA for PNG even when every pixel is opaque. If an
> upload is refused, flip the format toggle to JPEG and re-export.

## Automation

The zustand store is exposed as `window.__store`, in packaged builds too, so an
agent driving the app over CDP (Argent, Playwright) or the devtools console can
script it:

```js
await window.__store.getState().addFiles([file])
window.__store.getState().setSettings({ layout: 'bleed', sizeId: 'android-phone' })
```

`window.__renderExport` runs the real export renderer without the native dialog,
and `window.desktop` exposes the Electron bridge (`chooseFolder`, `writeFiles`,
`revealPath`). This is a local tool with no untrusted content — scripting it is a
feature, not an exposure.

## Contributing

Contributions are welcome, and most of them are small: a device, a background, a
font, a layout, a rhythm, a template are each one object in `src/presets/`.

Start with [CONTRIBUTING.md](CONTRIBUTING.md), and read `_context/rules.md`
before touching anything that renders — those invariants are not style
preferences, breaking them produces wrong exported pixels.

```bash
pnpm install
pnpm electron:dev
pnpm typecheck && pnpm lint && pnpm test
```

## Not built yet

- Pulling screenshots straight off a booted simulator or emulator
- Exporting every required size in one pass
- Persisting a project between launches
- Windows and Linux builds
- Auto-update (rebuild to update)

## License

[MIT](LICENSE) © Hebert Porto
