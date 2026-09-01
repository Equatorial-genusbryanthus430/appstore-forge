import type { OverridableKey, Screen, Settings } from '../types'

/** A screen's own values win; everything else falls through to the global settings. */
export function effectiveSettings(screen: Screen, settings: Settings): Settings {
  return { ...settings, ...screen.overrides }
}

export const isOverridden = (screen: Screen | null, key: OverridableKey): boolean =>
  screen ? screen.overrides[key] !== undefined : false

/** Which controls belong to which sidebar section, for the per-section reset affordance. */
export const SECTION_KEYS: Record<string, OverridableKey[]> = {
  background: ['background', 'backdropColor'],
  device: ['deviceId', 'frameColorId'],
  layout: ['layout', 'positionId'],
  type: [
    'fontId',
    'headlineScale',
    'subheadScale',
    'headlineTracking',
    'textColor',
    'textAlign',
    'highlights',
  ],
  adjust: ['tilt', 'deviceScale'],
}
