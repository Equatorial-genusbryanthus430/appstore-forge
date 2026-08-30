export type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; from: string; to: string; angle: number }

export type NotchKind = 'island' | 'punch' | 'none'

/** A device frame is described geometrically and drawn with canvas primitives,
 *  so there are no bitmap assets to ship or license. */
export type DeviceGroup = 'iPhone' | 'iPad' | 'Android' | 'Other'

export type DeviceSpec = {
  id: string
  label: string
  group: DeviceGroup
  /** width / height of the *screen* area */
  screenAspect: number
  /** bezel thickness, as a fraction of the outer frame width */
  bezel: number
  /** outer corner radius, as a fraction of the outer frame width */
  radius: number
  notch: NotchKind
}

export type FrameColor = {
  id: string
  label: string
  body: string
  edge: string
}

export type PlacementSource = 'self' | 'next' | 'prev'

export type Placement = {
  /** which screenshot fills this frame */
  source: PlacementSource
  /** offset from the slot centre, as fractions of canvas width / height */
  dx: number
  dy: number
  scale: number
  rotate: number
}

export type Position = {
  id: string
  label: string
  /** drawn back to front */
  placements: Placement[]
}

export type LayoutId = 'text-top' | 'text-bottom' | 'bleed' | 'editorial' | 'centered'

export type Layout = {
  id: LayoutId
  label: string
  /** vertical band for the text block, as fractions of canvas height */
  text: { top: number; height: number } | null
  /** vertical band the device is fitted into; bottom may exceed 1 to bleed off-canvas */
  device: { top: number; bottom: number }
  padX: number
}

export type ExportSize = {
  id: string
  label: string
  store: 'App Store' | 'Google Play'
  w: number
  h: number
}

export type Screen = {
  id: string
  headline: string
  subhead: string
  /** key into the image registry; null while the slot is empty */
  imageId: string | null
  /** per-screen overrides; any key absent here inherits from the global settings */
  overrides: ScreenOverrides
}

/** Export size is deliberately global — every shot in a set must share one canvas size. */
export type OverridableKey = Exclude<keyof Settings, 'sizeId'>
export type ScreenOverrides = Partial<Pick<Settings, OverridableKey>>

export type TextAlign = 'center' | 'left'

export type Settings = {
  background: Background
  /** rounded card drawn behind the device band; null = none */
  backdropColor: string | null
  deviceId: string
  frameColorId: string
  positionId: string
  layout: LayoutId
  tilt: number
  deviceScale: number
  textColor: string
  textAlign: TextAlign
  /** marker bands behind `*starred*` headline words; spans cycle through the list */
  highlights: string[]
  fontId: string
  /** multipliers on the base headline / subtitle size */
  headlineScale: number
  subheadScale: number
  /** headline letter-spacing as a fraction of the font size (em) */
  headlineTracking: number
  sizeId: string
}

/**
 * A template is a complete look: a settings preset plus optional per-screen variants
 * that cycle by screen index (alternating backgrounds, tilts, highlight colours), which is
 * what gives a store listing its rhythm. Applying one resets the set to it.
 */
export type TemplateSpec = {
  id: string
  label: string
  /** one line for the gallery card */
  description: string
  /** applied on top of the defaults; export size and device are always kept */
  settings: Partial<Omit<Settings, 'sizeId' | 'deviceId'>>
  /** overrides pinned on screen `i` are `variants[i % variants.length]` */
  variants?: ScreenOverrides[]
  /** sample copy for the gallery thumbnail (first) and the empty editor (one per card) */
  samples: { headline: string; subhead: string }[]
}
