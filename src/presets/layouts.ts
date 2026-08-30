import type { Layout, LayoutId } from '../types'

/** Where the text band and the device band sit vertically. Fractions of canvas height. */
export const LAYOUTS: Layout[] = [
  { id: 'text-top', label: 'Text above', text: { top: 0.065, height: 0.165 }, device: { top: 0.27, bottom: 0.95 }, padX: 0.09 },
  { id: 'text-bottom', label: 'Text below', text: { top: 0.76, height: 0.165 }, device: { top: 0.06, bottom: 0.72 }, padX: 0.09 },
  { id: 'bleed', label: 'Bleed off edge', text: { top: 0.07, height: 0.175 }, device: { top: 0.29, bottom: 1.14 }, padX: 0.07 },
  // Room for a three-line display headline; the device sits low and runs off the bottom.
  { id: 'editorial', label: 'Tall text', text: { top: 0.07, height: 0.25 }, device: { top: 0.41, bottom: 1.12 }, padX: 0.085 },
  { id: 'centered', label: 'Device only', text: null, device: { top: 0.07, bottom: 0.93 }, padX: 0.10 },
]

export const getLayout = (id: LayoutId): Layout => LAYOUTS.find((t) => t.id === id) ?? LAYOUTS[0]
