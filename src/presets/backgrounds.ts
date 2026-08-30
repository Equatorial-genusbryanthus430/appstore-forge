import type { Background } from '../types'

export const SOLID_PRESETS: string[] = [
  '#eaf2ff', '#fdeee4', '#e6f6ee', '#eeeaf9', '#fde9ef', '#fdf3d8', '#e8f4f6', '#f1f1f3',
  '#1e6ff5', '#f0502d', '#12885a', '#1f2937', '#7c3aed', '#db2777', '#0d9488', '#111114',
]

export const GRADIENT_PRESETS: Extract<Background, { kind: 'gradient' }>[] = [
  { kind: 'gradient', from: '#6366f1', to: '#a855f7', angle: 135 },
  { kind: 'gradient', from: '#0ea5e9', to: '#22d3ee', angle: 135 },
  { kind: 'gradient', from: '#f97316', to: '#ec4899', angle: 135 },
  { kind: 'gradient', from: '#10b981', to: '#84cc16', angle: 135 },
  { kind: 'gradient', from: '#1e293b', to: '#0f172a', angle: 160 },
  { kind: 'gradient', from: '#fda4af', to: '#fef3c7', angle: 150 },
  { kind: 'gradient', from: '#4f46e5', to: '#0f172a', angle: 200 },
  { kind: 'gradient', from: '#e0f2fe', to: '#ede9fe', angle: 135 },
]
