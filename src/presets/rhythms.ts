import type { Rhythm, RhythmStep } from '../types'

/** Goldie's layout vocabulary mapped onto our layout × arrangement pairs. */
export const STEP = {
  classic: { layout: 'text-top', positionId: 'center', textAlign: 'center' },
  copyBelow: { layout: 'text-bottom', positionId: 'center', textAlign: 'center' },
  hero: { layout: 'hero', positionId: 'center', textAlign: 'center' },
  offset: { layout: 'hero', positionId: 'right', textAlign: 'left' },
  tilt: { layout: 'hero', positionId: 'tilted', textAlign: 'center' },
  tiltRight: { layout: 'hero', positionId: 'corner', textAlign: 'left' },
  duo: { layout: 'duo', positionId: 'duo', textAlign: 'center' },
  duoTilt: { layout: 'duo', positionId: 'duo-tilt', textAlign: 'center' },
  panorama: { layout: 'panorama', positionId: 'lean', textAlign: 'left' },
  panoramaDuo: { layout: 'panorama-duo', positionId: 'wings', textAlign: 'center' },
  minimal: { layout: 'centered', positionId: 'center' },
} satisfies Record<string, RhythmStep>

/**
 * Built-in rhythms, in Goldie's order. A rhythm shorter than the set repeats from its start.
 * `uniform` leaves every tile on the global layout and arrangement.
 */
export const RHYTHMS: Rhythm[] = [
  {
    id: 'uniform',
    label: 'Uniform',
    description: 'Every tile in the same layout and arrangement.',
    steps: [],
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'A panorama opener, then a hero, an offset, a breather and a tilt.',
    steps: [STEP.panorama, STEP.hero, STEP.offset, STEP.minimal, STEP.tilt],
  },
  {
    id: 'showcase',
    label: 'Showcase',
    description: 'Hero first, then tilted and paired screens, ending on a breather.',
    steps: [STEP.hero, STEP.tilt, STEP.duo, STEP.tiltRight, STEP.minimal],
  },
  {
    id: 'magazine',
    label: 'Magazine',
    description: 'Left-aligned copy and copy-below tiles alternating with big devices.',
    steps: [STEP.offset, STEP.copyBelow, STEP.tiltRight, STEP.hero, STEP.minimal],
  },
  {
    id: 'storyboard',
    label: 'Storyboard',
    description: 'A two-screen panorama, then a copy-below, a hero and a breather.',
    steps: [STEP.panoramaDuo, STEP.copyBelow, STEP.hero, STEP.minimal, STEP.tilt],
  },
  {
    id: 'dynamic',
    label: 'Dynamic',
    description: 'Everything tilted: a tilt, a tilted pair, a panorama, a breather.',
    steps: [STEP.tilt, STEP.duoTilt, STEP.panorama, STEP.minimal, STEP.tiltRight],
  },
]

export const getRhythm = (id: string): Rhythm => RHYTHMS.find((r) => r.id === id) ?? RHYTHMS[0]

/** The overrides rhythm step `index` pins; empty for uniform. */
export const rhythmStep = (rhythm: Rhythm, index: number): RhythmStep | null =>
  rhythm.steps.length ? rhythm.steps[index % rhythm.steps.length] : null
