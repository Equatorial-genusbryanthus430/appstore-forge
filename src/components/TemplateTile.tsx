import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { renderScene } from '../render/scene'
import { placeholderScreenshot } from '../render/placeholder'
import { slotCount, templateSettings, useStore, variantFor } from '../store'
import type { Screen, TemplateSpec } from '../types'

/**
 * Thumbnail of a template, drawn by the real renderer so it is exactly what applying it
 * produces. Shows the user's first screenshot once there is one, a drawn stand-in before.
 */
export function TemplateTile({
  template,
  width,
  height,
  active,
  onApply,
}: {
  template: TemplateSpec
  width: number
  height: number
  active: boolean
  onApply: () => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const global = useStore((s) => s.settings)
  const { first, second } = useStore(
    useShallow((s) => {
      const at = (i: number) => {
        const target = s.screens[i]
        return target?.imageId ? s.images[target.imageId] ?? null : null
      }
      return { first: at(0), second: at(1) ?? at(0) }
    }),
  )

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const sample: Screen = {
      id: `tile-${template.id}`,
      headline: template.samples[0].headline,
      subhead: template.samples[0].subhead,
      imageId: null,
      overrides: variantFor(template, 0),
    }
    const self = first ?? placeholderScreenshot()
    const next = second ?? self
    renderScene(ctx, width, height, sample, templateSettings(template, global), { self, next, prev: next })
  }, [template, global, first, second, width, height])

  return (
    <button className="template-card" data-active={active} onClick={onApply}>
      <canvas ref={ref} style={{ width, height }} className="block self-center rounded-xl" />
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
