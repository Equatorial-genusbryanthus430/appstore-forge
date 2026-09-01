import { useShallow } from 'zustand/react/shallow'
import type { SceneSources } from '../render/scene'
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
        return target.imageId ? (s.images[target.imageId] ?? null) : placeholderScreenshot()
      }
      const index = s.screens.findIndex((x) => x.id === screen.id)
      if (index < 0) return { self: null, next: null, prev: null }
      return { self: at(index), next: at(index + 1), prev: at(index - 1) }
    }),
  )
}
