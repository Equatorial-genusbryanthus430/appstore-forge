import type { Background, Layout, PlacementSource, Screen, Settings } from '../types'
import { frameAspect, getDevice, getFrameColor } from '../presets/devices'
import { getLayout } from '../presets/layouts'
import { getFont } from '../presets/fonts'
import { getPosition } from '../presets/positions'
import { effectiveSettings } from '../lib/settings'
import { drawDevice, type Box } from './frames'

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, bg: Background) {
  if (bg.kind === 'solid') {
    ctx.fillStyle = bg.color
  } else {
    // CSS-style angles: 180deg runs top to bottom, 135deg top-left to bottom-right.
    const rad = ((bg.angle - 90) * Math.PI) / 180
    const dx = Math.cos(rad)
    const dy = Math.sin(rad)
    const len = Math.abs(w * dx) + Math.abs(h * dy)
    const g = ctx.createLinearGradient(
      w / 2 - (dx * len) / 2,
      h / 2 - (dy * len) / 2,
      w / 2 + (dx * len) / 2,
      h / 2 + (dy * len) / 2,
    )
    g.addColorStop(0, bg.from)
    g.addColorStop(1, bg.to)
    ctx.fillStyle = g
  }
  ctx.fillRect(0, 0, w, h)
}

/**
 * Rounded card behind the device band. Sits a little above the device and, when the layout
 * bleeds the device off the bottom, runs off-canvas too so no bottom corners show.
 */
function drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, layout: Layout, color: string) {
  const r = w * 0.075
  const top = h * layout.device.top - h * 0.05
  const bottom = layout.device.bottom > 1 ? h + r : Math.min(h + r, h * layout.device.bottom + h * 0.05)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(w * 0.045, top, w * 0.91, bottom - top, r)
  ctx.fill()
}

/** A headline word with the index of the `*span*` it belongs to (-1 = plain). */
type Word = { text: string; span: number }

/** `The list that *feels* like a *notebook.*` → words tagged with their highlight span. */
export function parseMarkup(text: string): Word[] {
  const words: Word[] = []
  const parts = text.split('*')
  parts.forEach((part, i) => {
    // An unmatched trailing star is just dropped rather than highlighting the tail.
    const inSpan = i % 2 === 1 && i < parts.length - 1
    const span = inSpan ? (i - 1) / 2 : -1
    for (const t of part.split(/\s+/)) if (t) words.push({ text: t, span })
  })
  return words
}

export const stripMarkup = (text: string) => parseMarkup(text).map((w) => w.text).join(' ')

type Line = { words: Word[]; widths: number[]; width: number }

function wrap(ctx: CanvasRenderingContext2D, words: Word[], maxWidth: number): Line[] {
  if (!words.length) return []
  const space = ctx.measureText(' ').width
  const lines: Line[] = []
  let line: Line = { words: [], widths: [], width: 0 }
  for (const word of words) {
    const ww = ctx.measureText(word.text).width
    const next = line.words.length ? line.width + space + ww : ww
    if (line.words.length && next > maxWidth) {
      lines.push(line)
      line = { words: [word], widths: [ww], width: ww }
    } else {
      line.words.push(word)
      line.widths.push(ww)
      line.width = next
    }
  }
  lines.push(line)
  return lines
}

/**
 * How tall the text block may grow before it would collide with the device. This is the
 * gap to the device band, not the nominal band height — otherwise turning the size slider
 * up would just trigger the auto-shrink and feel broken.
 */
function availableTextHeight(layout: Layout, h: number): number {
  if (!layout.text) return 0
  const textBelowDevice = layout.text.top > layout.device.top
  const limit = textBelowDevice ? 1 - layout.text.top - 0.03 : layout.device.top - layout.text.top - 0.02
  return Math.max(layout.text.height, limit) * h
}

type TextLayout = { headSize: number; subSize: number; headLines: Line[]; subLines: Line[]; gap: number }

const HEAD_LH = 1.14
const SUB_LH = 1.4

function setHeadFont(ctx: CanvasRenderingContext2D, size: number, settings: Settings) {
  ctx.font = `700 ${size}px ${getFont(settings.fontId).stack}`
  ctx.letterSpacing = `${size * settings.headlineTracking}px`
}
function setSubFont(ctx: CanvasRenderingContext2D, size: number, settings: Settings) {
  ctx.font = `400 ${size}px ${getFont(settings.fontId).stack}`
  ctx.letterSpacing = '0px'
}

function layoutText(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  settings: Settings,
  maxWidth: number,
  maxHeight: number,
  h: number,
): TextLayout {
  let headSize = h * 0.040 * settings.headlineScale
  let subSize = h * 0.0205 * settings.subheadScale
  const gap = h * 0.018
  const headWords = parseMarkup(screen.headline)
  const subWords = parseMarkup(screen.subhead)

  // Shrink until it fits: overflowing into the device is worse than smaller type.
  for (let i = 0; i < 30; i++) {
    setHeadFont(ctx, headSize, settings)
    const headLines = wrap(ctx, headWords, maxWidth)
    setSubFont(ctx, subSize, settings)
    const subLines = wrap(ctx, subWords, maxWidth)
    const total =
      headLines.length * headSize * HEAD_LH + (subLines.length ? gap + subLines.length * subSize * SUB_LH : 0)
    if (total <= maxHeight || headSize < h * 0.014) {
      return { headSize, subSize, headLines, subLines, gap }
    }
    headSize *= 0.94
    subSize *= 0.94
  }
  return { headSize, subSize, headLines: [], subLines: [], gap }
}

/** Draw one line of words at `y` (top of the em box), with marker bands under starred spans. */
function drawLine(
  ctx: CanvasRenderingContext2D,
  line: Line,
  x0: number,
  y: number,
  size: number,
  highlights: string[],
) {
  const space = ctx.measureText(' ').width
  const xs: number[] = []
  let x = x0
  line.words.forEach((_, i) => {
    xs.push(x)
    x += line.widths[i] + space
  })

  // Marker bands first, one continuous band per run of same-span words, so a highlighted
  // phrase reads as one stroke rather than a row of boxes.
  if (highlights.length) {
    const pad = size * 0.07
    let i = 0
    while (i < line.words.length) {
      const span = line.words[i].span
      let j = i
      while (j + 1 < line.words.length && line.words[j + 1].span === span) j++
      if (span >= 0) {
        const left = xs[i] - pad
        const right = xs[j] + line.widths[j] + pad
        ctx.save()
        ctx.fillStyle = highlights[span % highlights.length]
        ctx.beginPath()
        ctx.roundRect(left, y + size * 0.1, right - left, size * 0.98, size * 0.07)
        ctx.fill()
        ctx.restore()
      }
      i = j + 1
    }
  }

  line.words.forEach((word, i) => ctx.fillText(word.text, xs[i], y))
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  layout: Layout,
  screen: Screen,
  settings: Settings,
) {
  if (!layout.text || (!screen.headline && !screen.subhead)) return

  const maxWidth = w * (1 - layout.padX * 2)
  const bandTop = layout.text.top * h
  const bandHeight = layout.text.height * h
  const { headSize, subSize, headLines, subLines, gap } = layoutText(
    ctx, screen, settings, maxWidth, availableTextHeight(layout, h), h,
  )

  const total =
    headLines.length * headSize * HEAD_LH + (subLines.length ? gap + subLines.length * subSize * SUB_LH : 0)
  let y = bandTop + (bandHeight - total) / 2
  const startX = (lineWidth: number) =>
    settings.textAlign === 'left' ? w * layout.padX : (w - lineWidth) / 2

  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = settings.textColor

  setHeadFont(ctx, headSize, settings)
  for (const line of headLines) {
    drawLine(ctx, line, startX(line.width), y, headSize, settings.highlights)
    y += headSize * HEAD_LH
  }
  if (subLines.length) {
    y += gap
    ctx.globalAlpha = 0.72
    setSubFont(ctx, subSize, settings)
    for (const line of subLines) {
      drawLine(ctx, line, startX(line.width), y, subSize, [])
      y += subSize * SUB_LH
    }
  }
  ctx.restore()
}

/**
 * Single source of truth for what a screenshot looks like. The on-screen preview and the
 * exported PNG both call this — only `w`/`h` differ — so the preview is exact, not an approximation.
 */
export type SceneSources = Partial<Record<PlacementSource, CanvasImageSource | null>>

export function renderScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  screen: Screen,
  settings: Settings,
  sources: SceneSources,
) {
  // One place resolves inheritance, so preview and export can never disagree about it.
  settings = effectiveSettings(screen, settings)
  ctx.clearRect(0, 0, w, h)
  drawBackground(ctx, w, h, settings.background)

  const layout = getLayout(settings.layout)
  if (settings.backdropColor) drawBackdrop(ctx, w, h, layout, settings.backdropColor)
  drawTextBlock(ctx, w, h, layout, screen, settings)

  const device = getDevice(settings.deviceId)
  const color = getFrameColor(settings.frameColorId)
  const aspect = frameAspect(device)

  const slot: Box = {
    x: w * layout.padX,
    y: h * layout.device.top,
    w: w * (1 - layout.padX * 2),
    h: h * (layout.device.bottom - layout.device.top),
  }

  // Fit one frame inside the slot, preserving aspect; each placement scales from there.
  const baseW = Math.min(slot.w, slot.h * aspect) * settings.deviceScale
  const cx = slot.x + slot.w / 2
  const cy = slot.y + slot.h / 2

  for (const placement of getPosition(settings.positionId).placements) {
    const fw = baseW * placement.scale
    const fh = fw / aspect
    const box: Box = {
      x: cx + placement.dx * w - fw / 2,
      y: cy + placement.dy * h - fh / 2,
      w: fw,
      h: fh,
    }
    // A multi-device arrangement falls back to the current screenshot when there is no
    // neighbour, so a single-screen project still renders every frame.
    const img = sources[placement.source] ?? sources.self ?? null
    const angle = placement.rotate + settings.tilt

    ctx.save()
    if (angle !== 0) {
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2)
      ctx.rotate((angle * Math.PI) / 180)
      ctx.translate(-(box.x + box.w / 2), -(box.y + box.h / 2))
    }
    drawDevice(ctx, box, device, color, img)
    ctx.restore()
  }
}
