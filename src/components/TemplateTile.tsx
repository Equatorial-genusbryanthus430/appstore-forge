import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { renderScene, sceneSpan } from '../render/scene'
import { placeholderScreenshot } from '../render/placeholder'
import { slotCount, templateSettings, useStore, variantFor } from '../store'
import type { Screen, Settings, TemplateSpec } from '../types'

function StripTile({
  screen,
  settings,
  width,
  height,
  sources,
}: {
  screen: Screen
  settings: Settings
  width: number
  height: number
  sources: { self: CanvasImageSource; next: CanvasImageSource; prev: CanvasImageSource }
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const span = sceneSpan(screen, settings)
  const fullWidth = width * span

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(fullWidth * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    renderScene(ctx, width, height, screen, settings, sources)
  }, [screen, settings, sources, width, height, fullWidth])

  return (
    <div className="relative shrink-0" style={{ width: fullWidth, height }}>
      <canvas ref={ref} style={{ width: fullWidth, height }} className="block rounded-md" />
      {span > 1 && <div className="seam" style={{ left: width }} />}
    </div>
  )
}

/**
 * A template card: the whole strip it produces — one tile per slot, drawn by the real renderer
 * with the template's sample copy — so the rhythm is visible, not just the first tile. Shows the
 * user's own screenshots once there are any, a drawn stand-in before.
 */
export function TemplateTile({
  template,
  width,
  height,
  active,
  onApply,
}: {
  template: TemplateSpec
  /** one store tile, in CSS px */
  width: number
  height: number
  active: boolean
  onApply: () => void
}) {
  const global = useStore((s) => s.settings)
  const images = useStore(
    useShallow((s) =>
      s.screens.map((x) => (x.imageId ? (s.images[x.imageId] ?? null) : null)).filter(Boolean),
    ),
  )
  const settings = templateSettings(template, global)
  const count = slotCount(template) || 3
  const placeholder = placeholderScreenshot()
  const at = (i: number) =>
    images.length ? images[((i % images.length) + images.length) % images.length]! : placeholder

  const tiles: {
    screen: Screen
    sources: { self: CanvasImageSource; next: CanvasImageSource; prev: CanvasImageSource }
  }[] = []
  for (let i = 0; i < count; i++) {
    const sample = template.samples[i % template.samples.length]
    tiles.push({
      screen: {
        id: `tile-${template.id}-${i}`,
        headline: sample.headline,
        subhead: sample.subhead,
        imageId: null,
        overrides: variantFor(template, i),
      },
      sources: { self: at(i), next: at(i + 1), prev: at(i - 1) },
    })
  }

  return (
    <button className="template-card" data-active={active} onClick={onApply}>
      <div className="flex gap-1.5 overflow-x-auto rounded-lg p-1" style={{ background: 'var(--shell)' }}>
        {tiles.map((t) => (
          <StripTile
            key={t.screen.id}
            screen={t.screen}
            settings={settings}
            width={width}
            height={height}
            sources={t.sources}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <span className="text-[14px] font-semibold">{template.label}</span>
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {slotCount(template) ? `${slotCount(template)} screens` : 'Any number of screens'}
          </span>
        </span>
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-medium"
          style={{
            color: active ? 'var(--accent)' : 'var(--muted)',
            background: active ? 'rgba(30,111,245,0.08)' : 'var(--shell)',
          }}
        >
          {active ? 'Current' : 'Use'}
        </span>
      </div>
      <p className="text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
        {template.description}
      </p>
    </button>
  )
}
