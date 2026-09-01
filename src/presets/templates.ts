import type { TemplateSpec } from '../types'
import { STEP } from './rhythms'

/**
 * Complete looks. `settings` is applied over the defaults (so a template is a reset, not a
 * patch); `variants` cycle by screen index so a set alternates backgrounds and poses the way
 * a designed store listing does. Headline markup: `*word*` gets a marker band behind it.
 */
export const TEMPLATES: TemplateSpec[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Centred headline over a framed device on a soft solid background. Clean, quick, safe.',
    settings: {},
    samples: [
      { headline: 'Everything in *one place*', subhead: 'Notes, tasks and files together.' },
      { headline: 'Plan the week in seconds', subhead: 'Drag, drop, done.' },
      { headline: 'Works *offline*, syncs later', subhead: '' },
    ],
  },
  {
    id: 'notebook',
    label: 'Notebook',
    description: 'Warm paper tones, a big left-aligned headline with marker highlights, and a phone that runs off the bottom. Alternates colour and tilt across the set.',
    settings: {
      background: { kind: 'solid', color: '#f3efe4' },
      backdropColor: '#ebe5d6',
      frameColorId: 'black',
      positionId: 'center',
      layout: 'editorial',
      tilt: 0,
      deviceScale: 0.86,
      textColor: '#23231f',
      textAlign: 'left',
      highlights: ['#e9c7c2', '#cfdbc1', '#efcfb9'],
      fontId: 'inter',
      headlineScale: 1.5,
      subheadScale: 0.8,
      headlineTracking: -0.035,
    },
    // Cream / peach / sand / pink / cream, with the pose changing each time — the rhythm of the
    // reference listing. Colours travel with the screen when it is reordered.
    variants: [
      { background: { kind: 'solid', color: '#f3efe4' }, backdropColor: '#ebe5d6', positionId: 'center', highlights: ['#e9c7c2', '#cfdbc1'] },
      { background: { kind: 'solid', color: '#f6eee5' }, backdropColor: '#e8d8c3', positionId: 'tilted', highlights: ['#efcfb9', '#cfdbc1'] },
      { background: { kind: 'solid', color: '#efeadb' }, backdropColor: null, positionId: 'offset', highlights: ['#e9c7c2', '#cfdbc1'] },
      { background: { kind: 'solid', color: '#ecd7d8' }, backdropColor: '#e3c6c8', positionId: 'tilted', highlights: ['#f0d5c4', '#cfdbc1'] },
      { background: { kind: 'solid', color: '#f3efe4' }, backdropColor: '#d6e0cd', positionId: 'center', highlights: ['#cfdbc1', '#e9c7c2'] },
    ],
    samples: [
      { headline: 'The list that *feels* like a *notebook.*', subhead: '' },
      { headline: 'Hands full? *Just say it.*', subhead: 'Tap once. Talk. Multiple items, quantities, brands — all in one breath.' },
      { headline: 'Turn pictures *into text*', subhead: '' },
      { headline: 'Import recipes from *apps* & websites', subhead: 'Bring recipes in from the places you already save them.' },
      { headline: 'One list. *Whole* household.', subhead: '' },
    ],
  },
]

export const EDITORIAL: TemplateSpec = {
  id: 'editorial',
  label: 'Editorial',
  description:
    'A two-tile panorama opener, then a hero, an offset, a device-only breather and a tilt. Cool gradient, DM Sans, deep-blue frame.',
  settings: {
    background: { kind: 'gradient', from: '#e8f1ff', to: '#ffffff', angle: 160 },
    frameColorId: 'deep-blue',
    layout: 'hero',
    positionId: 'center',
    textColor: '#0e1b2a',
    textAlign: 'center',
    highlights: ['#bfdbfe', '#fde68a'],
    fontId: 'dm-sans',
    headlineScale: 1.25,
    subheadScale: 0.9,
    headlineTracking: -0.025,
  },
  rhythm: 'editorial',
  variants: [
    { ...STEP.panorama },
    { ...STEP.hero },
    { ...STEP.offset, background: { kind: 'gradient', from: '#f7faff', to: '#e8f1ff', angle: 200 } },
    { ...STEP.minimal },
    { ...STEP.tilt },
  ],
  samples: [
    { headline: 'Your whole day, *one glance*', subhead: 'Calendar, tasks and notes, together at last.' },
    { headline: 'Capture *anything*', subhead: 'Text, voice or a photo — it lands in the right place.' },
    { headline: 'Plan the week in seconds', subhead: 'Drag, drop, done.' },
    { headline: '', subhead: '' },
    { headline: 'Works *offline*, syncs later', subhead: '' },
  ],
}

TEMPLATES.push(EDITORIAL)

export const getTemplateSpec = (id: string): TemplateSpec => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
