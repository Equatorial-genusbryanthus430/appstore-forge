import type { Position } from '../types'

/**
 * Arrangements place one or more device frames inside the layout's device slot.
 * `dx`/`dy` are offsets from the slot centre in fractions of canvas width/height;
 * `source` picks which screenshot goes in that frame, so a multi-device arrangement
 * shows the neighbouring screens rather than repeating the same image.
 * Placements draw back to front.
 */
export const POSITIONS: Position[] = [
  {
    id: 'center',
    label: 'Single',
    placements: [{ source: 'self', dx: 0, dy: 0, scale: 1, rotate: 0 }],
  },
  {
    id: 'tilted',
    label: 'Tilted',
    placements: [{ source: 'self', dx: 0, dy: 0, scale: 0.98, rotate: -7 }],
  },
  {
    id: 'offset',
    label: 'Offset',
    placements: [{ source: 'self', dx: 0.15, dy: 0.01, scale: 1.06, rotate: -4 }],
  },
  {
    id: 'pair',
    label: 'Pair',
    placements: [
      { source: 'next', dx: 0.16, dy: -0.018, scale: 0.84, rotate: 7 },
      { source: 'self', dx: -0.09, dy: 0.018, scale: 0.94, rotate: -3 },
    ],
  },
  {
    id: 'trio',
    label: 'Trio',
    placements: [
      { source: 'prev', dx: -0.205, dy: 0.012, scale: 0.68, rotate: -11 },
      { source: 'next', dx: 0.205, dy: 0.012, scale: 0.68, rotate: 11 },
      { source: 'self', dx: 0, dy: -0.012, scale: 0.82, rotate: 0 },
    ],
  },
]

export const getPosition = (id: string): Position => POSITIONS.find((p) => p.id === id) ?? POSITIONS[0]
