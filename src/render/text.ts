import type { Layout, Screen, Settings } from '../types'
import { getFont } from '../presets/fonts'

/**
 * The text engine: markup parsing, line breaking, auto-shrink, and drawing. Split out of
 * `scene.ts` because it is the one part of the renderer with real logic in it — everything
 * up to `layoutText` is pure measurement and can be exercised without a canvas.
 */

/** The slice of a canvas context the measuring code touches. Narrow on purpose: a test can
 *  supply a stub measurer instead of standing up a real canvas. */
export type TextMeasurer = {
  measureText: (text: string) => { width: number }
  font: string
  letterSpacing: string
}

/** A headline word with the index of the `*span*` it belongs to (-1 = plain). */
export type Word = { text: string; span: number }

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

export const stripMarkup = (text: string) =>
  parseMarkup(text)
    .map((w) => w.text)
    .join(' ')

export type Line = { words: Word[]; widths: number[]; width: number }

export function wrap(ctx: TextMeasurer, words: Word[], maxWidth: number): Line[] {
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
export function availableTextHeight(layout: Layout, h: number): number {
  if (!layout.text) return 0
  const textBelowDevice = layout.text.top > layout.device.top
  const limit = textBelowDevice ? 1 - layout.text.top - 0.03 : layout.device.top - layout.text.top - 0.02
  return Math.max(layout.text.height, limit) * h
}

export type TextLayout = {
  headSize: number
  subSize: number
  headLines: Line[]
  subLines: Line[]
  gap: number
}

export const HEAD_LH = 1.14
export const SUB_LH = 1.4

export function setHeadFont(ctx: TextMeasurer, size: number, settings: Settings) {
  ctx.font = `700 ${size}px ${getFont(settings.fontId).stack}`
  ctx.letterSpacing = `${size * settings.headlineTracking}px`
}

export function setSubFont(ctx: TextMeasurer, size: number, settings: Settings) {
  ctx.font = `400 ${size}px ${getFont(settings.fontId).stack}`
  ctx.letterSpacing = '0px'
}

/** Total height of a laid-out block, headline + gap + subhead. */
export const blockHeight = ({ headLines, headSize, subLines, subSize, gap }: TextLayout) =>
  headLines.length * headSize * HEAD_LH + (subLines.length ? gap + subLines.length * subSize * SUB_LH : 0)

export function layoutText(
  ctx: TextMeasurer,
  screen: Screen,
  settings: Settings,
  maxWidth: number,
  maxHeight: number,
  h: number,
): TextLayout {
  let headSize = h * 0.04 * settings.headlineScale
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
    const candidate = { headSize, subSize, headLines, subLines, gap }
    if (blockHeight(candidate) <= maxHeight || headSize < h * 0.014) return candidate
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

export function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  W: number,
  tileW: number,
  h: number,
  layout: Layout,
  screen: Screen,
  settings: Settings,
) {
  if (!layout.text || (!screen.headline && !screen.subhead)) return

  // The text box: the tile minus padding by default, or wherever the layout puts it.
  const boxLeft = layout.text.left !== undefined ? W * layout.text.left : tileW * layout.padX
  const maxWidth = layout.text.width !== undefined ? W * layout.text.width : tileW * (1 - layout.padX * 2)
  const bandTop = layout.text.top * h
  const bandHeight = layout.text.height * h
  const block = layoutText(ctx, screen, settings, maxWidth, availableTextHeight(layout, h), h)
  const { headSize, subSize, headLines, subLines, gap } = block

  let y = bandTop + (bandHeight - blockHeight(block)) / 2
  const startX = (lineWidth: number) =>
    settings.textAlign === 'left' ? boxLeft : boxLeft + (maxWidth - lineWidth) / 2

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
