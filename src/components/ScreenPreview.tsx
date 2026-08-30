import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { renderScene, type SceneSources } from '../render/scene'
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

export function ScreenPreview({ screen, width, height }: { screen: Screen; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const settings = useStore((s) => s.settings)
  const sources = useSceneSources(screen)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    renderScene(ctx, width, height, screen, settings, sources)
  }, [screen, settings, sources, width, height])

  return <canvas ref={ref} style={{ width, height }} className="block rounded-xl" />
}
