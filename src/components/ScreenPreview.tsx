import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { renderScene, sceneSpan, type SceneSources } from '../render/scene'
import { placeholderScreenshot } from '../render/placeholder'
import { useStore } from '../store'
import type { Screen } from '../types'

/**
 * Neighbouring screenshots, wrapping around so multi-device arrangements never show a gap.
 * An unfilled slot previews with the drawn stand-in; export is gated until every slot is filled.
 */
export function useSceneSources(screen: Screen): SceneSources {
  return useStore(
    useShallow((s) => {
      const at = (i: number) => {
        const target = s.screens[(i + s.screens.length) % (s.screens.length || 1)]
        if (!target) return null
        return target.imageId ? s.images[target.imageId] ?? null : placeholderScreenshot()
      }
      const index = s.screens.findIndex((x) => x.id === screen.id)
      if (index < 0) return { self: null, next: null, prev: null }
      return { self: at(index), next: at(index + 1), prev: at(index - 1) }
    }),
  )
}

/** `width`/`height` are one store tile; a span-2 composition renders twice as wide with a seam marker. */
export function ScreenPreview({ screen, width, height }: { screen: Screen; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const settings = useStore((s) => s.settings)
  const sources = useSceneSources(screen)
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
    <div className="relative" style={{ width: fullWidth, height }}>
      <canvas ref={ref} style={{ width: fullWidth, height }} className="block rounded-xl" />
      {span > 1 && <div className="seam" style={{ left: width }} title="The store shows this as two tiles" />}
    </div>
  )
}
