import type { TemplateSpec } from '../types'

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

export const getTemplateSpec = (id: string): TemplateSpec => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
