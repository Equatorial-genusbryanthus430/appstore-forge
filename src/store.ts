import { create } from 'zustand'
import { getRhythm, rhythmStep } from './presets/rhythms'
import { getTemplateSpec } from './presets/templates'
import type { Screen, ScreenOverrides, Settings, TemplateSpec } from './types'

/** The guided flow. Steps are navigation and status, never a gate — any step is one click away. */
export type StepId = 'target' | 'look' | 'shots' | 'copy' | 'tune' | 'review'
export const STEPS: StepId[] = ['target', 'look', 'shots', 'copy', 'tune', 'review']

/** Cosmetic store-page details for the preview; nothing here reaches the exported pixels. */
export type Listing = { name: string; subtitle: string; developer: string; category: string }

let seq = 0
const nextId = () => `s${++seq}`

export const DEFAULT_SETTINGS: Settings = {
  background: { kind: 'solid', color: '#eaf2ff' },
  backdropColor: null,
  deviceId: 'iphone-17-pro',
  frameColorId: 'deep-blue',
  positionId: 'center',
  layout: 'text-top',
  tilt: 0,
  deviceScale: 1,
  textColor: '#111114',
  textAlign: 'center',
  highlights: ['#ffe27a'],
  fontId: 'inter',
  headlineScale: 1,
  subheadScale: 1,
  headlineTracking: -0.01,
  sizeId: 'iphone-6-9',
}

/** The overrides a template pins on the screen at `index`; empty for templates without variants. */
export const variantFor = (template: TemplateSpec, index: number): ScreenOverrides =>
  template.variants?.length ? { ...template.variants[index % template.variants.length] } : {}

/** A set template has a fixed number of screens — one per variant. 0 means freeform. */
export const slotCount = (template: TemplateSpec): number => template.variants?.length ?? 0

/** An unfilled slot carries the template's sample copy until a screenshot lands in it. */
const emptySlot = (template: TemplateSpec, index: number): Screen => ({
  id: nextId(),
  headline: template.samples[index % template.samples.length]?.headline ?? '',
  subhead: template.samples[index % template.samples.length]?.subhead ?? '',
  imageId: null,
  overrides: variantFor(template, index),
})

/** A template is a reset: everything goes back to defaults, then the template's look is laid on
 *  top. Export size and device are the user's choice and survive. */
export const templateSettings = (template: TemplateSpec, current: Settings): Settings => ({
  ...DEFAULT_SETTINGS,
  ...template.settings,
  sizeId: current.sizeId,
  deviceId: current.deviceId,
})

type State = {
  screens: Screen[]
  images: Record<string, HTMLImageElement>
  settings: Settings
  /** last template applied; new screens pick up its variant cycle */
  templateId: string
  /** the strip's rhythm: 'uniform', a built-in id, or 'template' when the template's own variants set it */
  rhythmId: string
  /** pin each screen's layout/arrangement/alignment to the rhythm's step for its index */
  applyRhythm: (id: string) => void
  step: StepId
  setStep: (step: StepId) => void
  listing: Listing
  setListing: (patch: Partial<Listing>) => void
  format: 'png' | 'jpeg'
  applyTemplate: (id: string) => void
  /** fills empty slots in order, then appends */
  addFiles: (files: File[]) => Promise<void>
  /** put one screenshot into a specific screen, replacing what was there */
  setImage: (id: string, file: File) => Promise<void>
  /** empty a slot without removing it */
  clearImage: (id: string) => void
  updateScreen: (id: string, patch: Partial<Screen>) => void
  removeScreen: (id: string) => void
  moveScreen: (id: string, delta: number) => void
  setSettings: (patch: Partial<Settings>) => void
  setFormat: (format: 'png' | 'jpeg') => void
  selectedId: string | null
  selectScreen: (id: string | null) => void
  setOverride: (id: string, patch: ScreenOverrides) => void
  clearOverrides: (id: string, keys: (keyof ScreenOverrides)[]) => void
  clearAllOverrides: () => void
  reset: () => void
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await img.decode()
  return img
}

export const useStore = create<State>((set) => ({
  screens: [],
  images: {},
  settings: DEFAULT_SETTINGS,
  templateId: 'classic',
  rhythmId: 'uniform',
  step: 'target',
  setStep: (step) => set({ step }),
  listing: { name: '', subtitle: '', developer: '', category: '' },
  setListing: (patch) => set((state) => ({ listing: { ...state.listing, ...patch } })),
  format: 'png',

  applyRhythm: (id) =>
    set((state) => {
      const rhythm = getRhythm(id)
      return {
        rhythmId: rhythm.id,
        screens: state.screens.map((s, i) => {
          // Only the composition keys move; a Notebook screen keeps its colours.
          const { layout: _l, positionId: _p, textAlign: _t, ...rest } = s.overrides
          const step = rhythmStep(rhythm, i)
          return { ...s, overrides: step ? { ...rest, ...step } : rest }
        }),
      }
    }),

  applyTemplate: (id) =>
    set((state) => {
      const template = getTemplateSpec(id)
      const slots = slotCount(template)
      // A set template lays out every slot up front so the whole look is visible before any
      // screenshot exists. Screens that already hold an image keep it (and their copy); unfilled
      // slots take the new template's sample copy; a freeform template drops empty slots.
      const filled = state.screens.filter((s) => s.imageId !== null)
      const count = Math.max(slots, filled.length)
      const screens: Screen[] = []
      for (let i = 0; i < count; i++) {
        const existing = filled[i]
        screens.push(existing ? { ...existing, overrides: variantFor(template, i) } : emptySlot(template, i))
      }
      return {
        templateId: template.id,
        rhythmId: template.rhythm ?? (template.variants?.length ? 'template' : 'uniform'),
        settings: templateSettings(template, state.settings),
        screens,
        selectedId: screens.some((s) => s.id === state.selectedId) ? state.selectedId : null,
      }
    }),

  addFiles: async (files) => {
    const usable = files.filter((f) => f.type.startsWith('image/'))
    if (!usable.length) return
    const loaded = await Promise.all(
      usable.map(async (file) => ({ file, img: await loadImage(file) })),
    )
    set((state) => {
      const images = { ...state.images }
      const screens = [...state.screens]
      const template = getTemplateSpec(state.templateId)
      let slot = screens.findIndex((s) => s.imageId === null)
      for (const { file, img } of loaded) {
        const id = nextId()
        images[id] = img
        if (slot >= 0) {
          // Fill the next empty slot; the slot keeps its sample copy so the look stays intact.
          screens[slot] = { ...screens[slot], imageId: id }
          slot = screens.findIndex((s, i) => i > slot && s.imageId === null)
        } else {
          // Continue the template's variant cycle and the rhythm so a later drop matches.
          const step = rhythmStep(getRhythm(state.rhythmId), screens.length)
          screens.push({
            id,
            headline: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
            subhead: '',
            imageId: id,
            overrides: { ...variantFor(template, screens.length), ...(step ?? {}) },
          })
        }
      }
      return { images, screens }
    })
  },

  setImage: async (id, file) => {
    if (!file.type.startsWith('image/')) return
    const img = await loadImage(file)
    set((state) => {
      const imageId = nextId()
      return {
        images: { ...state.images, [imageId]: img },
        screens: state.screens.map((s) => (s.id === id ? { ...s, imageId } : s)),
      }
    })
  },

  clearImage: (id) =>
    set((state) => ({ screens: state.screens.map((s) => (s.id === id ? { ...s, imageId: null } : s)) })),

  updateScreen: (id, patch) =>
    set((state) => ({
      screens: state.screens.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  removeScreen: (id) =>
    set((state) => ({
      screens: state.screens.filter((s) => s.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  moveScreen: (id, delta) =>
    set((state) => {
      const from = state.screens.findIndex((s) => s.id === id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= state.screens.length) return state
      const screens = [...state.screens]
      const [moved] = screens.splice(from, 1)
      screens.splice(to, 0, moved)
      return { screens }
    }),

  setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
  setFormat: (format) => set({ format }),

  selectedId: null,
  selectScreen: (id) => set({ selectedId: id }),

  setOverride: (id, patch) =>
    set((state) => ({
      screens: state.screens.map((s) => (s.id === id ? { ...s, overrides: { ...s.overrides, ...patch } } : s)),
    })),

  clearOverrides: (id, keys) =>
    set((state) => ({
      screens: state.screens.map((s) => {
        if (s.id !== id) return s
        const overrides = { ...s.overrides }
        for (const key of keys) delete overrides[key]
        return { ...s, overrides }
      }),
    })),

  clearAllOverrides: () =>
    set((state) => ({ screens: state.screens.map((s) => ({ ...s, overrides: {} })) })),
  reset: () => set({ screens: [], images: {}, selectedId: null }),
}))

// Automation handle: lets an agent (Argent/CDP) or the devtools console drive the editor
// without synthesising drag-and-drop. Kept in packaged builds too — this is a local tool
// with no untrusted content, and scripting it is a feature rather than an exposure.
;(window as unknown as { __store: typeof useStore }).__store = useStore
