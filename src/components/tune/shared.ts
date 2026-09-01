import type { Background, ScreenOverrides, Settings } from '../../types'

/**
 * Every tune section reads the *resolved* settings for the active scope and writes back
 * through `put`, which the panel points at either the selected screen's overrides or the
 * global settings. A section never needs to know which scope it is editing.
 */
export type SectionProps = {
  settings: Settings
  put: (patch: ScreenOverrides) => void
}

export const gradientCss = (g: Extract<Background, { kind: 'gradient' }>) =>
  `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`
