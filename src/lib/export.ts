import { zipSync } from 'fflate'
import { renderScene, stripMarkup } from '../render/scene'
import { getSize } from '../presets/sizes'
import type { Screen, Settings } from '../types'

export type DesktopBridge = {
  platform: string
  chooseFolder: () => Promise<string | null>
  writeFiles: (dir: string, folder: string, files: { name: string; data: Uint8Array }[]) => Promise<string>
  revealPath: (target: string) => Promise<void>
}

export const desktop = (): DesktopBridge | null =>
  (window as unknown as { desktop?: DesktopBridge }).desktop ?? null

export type ExportResult =
  | { kind: 'saved'; dir: string; count: number }
  | { kind: 'downloaded'; count: number }
  | { kind: 'cancelled' }

const slug = (text: string, fallback: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || fallback

function toBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      format === 'png' ? 'image/png' : 'image/jpeg',
      format === 'png' ? undefined : 0.95,
    )
  })
}

/** Render every screen at full store resolution. Delivery is the caller's problem. */
export async function renderAll(
  screens: Screen[],
  settings: Settings,
  images: Record<string, HTMLImageElement>,
  format: 'png' | 'jpeg',
) {
  const size = getSize(settings.sizeId)
  const canvas = document.createElement('canvas')
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('2D canvas unavailable')

  // Same neighbour-wrapping the preview uses, so multi-device arrangements export identically.
  const imageAt = (i: number) => {
    const target = screens[(i + screens.length) % (screens.length || 1)]
    return target?.imageId ? images[target.imageId] ?? null : null
  }

  const files: { name: string; data: Uint8Array }[] = []
  for (const [i, screen] of screens.entries()) {
    renderScene(ctx, size.w, size.h, screen, settings, {
      self: imageAt(i),
      next: imageAt(i + 1),
      prev: imageAt(i - 1),
    })
    const blob = await toBlob(canvas, format)
    files.push({
      name: `${String(i + 1).padStart(2, '0')}-${slug(stripMarkup(screen.headline), 'screen')}.${format === 'png' ? 'png' : 'jpg'}`,
      data: new Uint8Array(await blob.arrayBuffer()),
    })
  }
  return { files, folder: `store-screenshots-${size.id}` }
}

/**
 * In the desktop app this writes real files into a folder the user picks and opens it
 * in Finder. In a plain browser there is no filesystem, so it falls back to a zip download.
 */
export async function exportAll(
  screens: Screen[],
  settings: Settings,
  images: Record<string, HTMLImageElement>,
  format: 'png' | 'jpeg',
): Promise<ExportResult> {
  const bridge = desktop()

  if (bridge) {
    const dir = await bridge.chooseFolder()
    if (!dir) return { kind: 'cancelled' }
    const { files, folder } = await renderAll(screens, settings, images, format)
    const written = await bridge.writeFiles(dir, folder, files)
    await bridge.revealPath(written)
    return { kind: 'saved', dir: written, count: files.length }
  }

  const { files, folder } = await renderAll(screens, settings, images, format)
  const entries: Record<string, Uint8Array> = {}
  for (const file of files) entries[`${folder}/${file.name}`] = file.data

  const zip = zipSync(entries, { level: 6 })
  const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: 'application/zip' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${folder}.zip`
  a.click()
  URL.revokeObjectURL(url)
  return { kind: 'downloaded', count: files.length }
}

// Automation hook, mirroring `window.__store`: renders the real export at full store
// resolution without going through the native folder dialog, so the export path itself
// can be exercised by an agent or from the devtools console.
;(window as unknown as { __renderExport: typeof renderAll }).__renderExport = renderAll
