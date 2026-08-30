/**
 * A stand-in app screenshot for template thumbnails, drawn with canvas primitives so there is
 * no bitmap to ship. Replaced by the user's own first screenshot as soon as one exists.
 */
let cached: HTMLCanvasElement | null = null

export function placeholderScreenshot(): HTMLCanvasElement {
  if (cached) return cached
  const w = 1320
  const h = 2868
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const font = '"Inter Variable", "Inter", -apple-system, sans-serif'

  ctx.fillStyle = '#fbfaf6'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#1b1b18'
  ctx.font = `600 ${w * 0.038}px ${font}`
  ctx.textBaseline = 'middle'
  ctx.fillText('9:41', w * 0.085, h * 0.028)
  ctx.textAlign = 'right'
  for (const [i, bw] of [0.012, 0.012, 0.03].entries()) {
    ctx.fillRect(w * (0.92 - i * 0.035) - bw * w, h * 0.024, bw * w, h * 0.008)
  }
  ctx.textAlign = 'left'

  ctx.fillStyle = '#1b1b18'
  ctx.font = `700 ${w * 0.075}px ${font}`
  ctx.fillText('Grocery list', w * 0.085, h * 0.1)
  ctx.fillStyle = '#8a8a82'
  ctx.font = `400 ${w * 0.036}px ${font}`
  ctx.fillText('Saturday · 8 items', w * 0.085, h * 0.14)

  ctx.fillStyle = '#efece3'
  ctx.beginPath()
  ctx.roundRect(w * 0.085, h * 0.175, w * 0.83, h * 0.05, w * 0.03)
  ctx.fill()
  ctx.fillStyle = '#a5a49b'
  ctx.font = `400 ${w * 0.036}px ${font}`
  ctx.fillText('Search', w * 0.14, h * 0.2)

  const rows = [
    ['Bananas', true], ['Oat milk', true], ['Sourdough', false], ['Eggs', false],
    ['Tomatoes', false], ['Basil', false], ['Olive oil', false], ['Coffee beans', false],
  ] as const
  rows.forEach(([label, done], i) => {
    const y = h * (0.27 + i * 0.062)
    ctx.strokeStyle = '#c9c7bd'
    ctx.lineWidth = w * 0.004
    ctx.beginPath()
    ctx.roundRect(w * 0.085, y - w * 0.024, w * 0.048, w * 0.048, w * 0.01)
    ctx.stroke()
    if (done) {
      ctx.fillStyle = '#1b1b18'
      ctx.beginPath()
      ctx.roundRect(w * 0.085, y - w * 0.024, w * 0.048, w * 0.048, w * 0.01)
      ctx.fill()
    }
    ctx.fillStyle = done ? '#a5a49b' : '#1b1b18'
    ctx.font = `500 ${w * 0.042}px ${font}`
    ctx.fillText(label, w * 0.17, y)
    ctx.fillStyle = '#ecebe4'
    ctx.fillRect(w * 0.085, y + h * 0.028, w * 0.83, h * 0.0012)
  })

  ctx.fillStyle = '#1b1b18'
  ctx.beginPath()
  ctx.arc(w * 0.85, h * 0.9, w * 0.07, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#fbfaf6'
  ctx.lineWidth = w * 0.008
  ctx.beginPath()
  ctx.moveTo(w * 0.85 - w * 0.03, h * 0.9)
  ctx.lineTo(w * 0.85 + w * 0.03, h * 0.9)
  ctx.moveTo(w * 0.85, h * 0.9 - w * 0.03)
  ctx.lineTo(w * 0.85, h * 0.9 + w * 0.03)
  ctx.stroke()

  cached = c
  return c
}
