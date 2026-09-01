import { describe, expect, it } from 'vitest'
import { composeDevices, sceneSpan } from './scene'
import { getLayout } from '../presets/layouts'
import { POSITIONS, getPosition } from '../presets/positions'
import { DEFAULT_SETTINGS } from '../store'
import type { Screen } from '../types'

const TILE = { w: 1320, h: 2868 }
const ASPECT = 0.46
const screen = (overrides: Screen['overrides'] = {}): Screen => ({
  id: 'test',
  headline: 'Head',
  subhead: '',
  imageId: null,
  overrides,
})

describe('composeDevices', () => {
  it('emits one box per placement in the arrangement', () => {
    const boxes = composeDevices(getLayout('duo'), 'duo', TILE.w, TILE.h, ASPECT, 1, 0)
    expect(boxes).toHaveLength(getPosition('duo').placements.length)
  })

  it('preserves the device aspect ratio on every box', () => {
    for (const { box } of composeDevices(getLayout('hero'), 'center', TILE.w, TILE.h, ASPECT, 1, 0)) {
      expect(box.w / box.h).toBeCloseTo(ASPECT, 5)
    }
  })

  it('centres a single frame in its band', () => {
    const layout = getLayout('text-top')
    const [{ box }] = composeDevices(layout, 'center', TILE.w, TILE.h, ASPECT, 1, 0)
    expect(box.x + box.w / 2).toBeCloseTo(TILE.w / 2, 5)
  })

  it('scales the frame by deviceScale about the same centre', () => {
    const layout = getLayout('text-top')
    const [a] = composeDevices(layout, 'center', TILE.w, TILE.h, ASPECT, 1, 0)
    const [b] = composeDevices(layout, 'center', TILE.w, TILE.h, ASPECT, 0.5, 0)
    expect(b.box.w).toBeCloseTo(a.box.w * 0.5, 5)
    expect(b.box.x + b.box.w / 2).toBeCloseTo(a.box.x + a.box.w / 2, 5)
  })

  it('adds the global tilt on top of each placement rotation', () => {
    const layout = getLayout('duo')
    const plain = composeDevices(layout, 'duo-tilt', TILE.w, TILE.h, ASPECT, 1, 0)
    const tilted = composeDevices(layout, 'duo-tilt', TILE.w, TILE.h, ASPECT, 1, 7)
    tilted.forEach((d, i) => expect(d.angle).toBeCloseTo(plain[i].angle + 7, 5))
  })

  it('lays a span-2 composition out across two tiles', () => {
    const layout = getLayout('panorama')
    const boxes = composeDevices(layout, 'lean', TILE.w, TILE.h, ASPECT, 1, 0)
    const right = Math.max(...boxes.map((b) => b.box.x + b.box.w))
    expect(layout.span).toBe(2)
    expect(right).toBeGreaterThan(TILE.w)
  })

  it('honours a layout that fixes the frame width instead of fitting the band', () => {
    const layout = getLayout('hero')
    const [{ box }] = composeDevices(layout, 'center', TILE.w, TILE.h, ASPECT, 1, 0)
    expect(box.w).toBeCloseTo(TILE.w * layout.device.width!, 5)
  })
})

describe('sceneSpan', () => {
  it('is one tile for an ordinary layout', () => {
    expect(sceneSpan(screen(), DEFAULT_SETTINGS)).toBe(1)
  })

  it('is two tiles for a panorama', () => {
    expect(sceneSpan(screen(), { ...DEFAULT_SETTINGS, layout: 'panorama' })).toBe(2)
  })

  it('reads the screen override, not the global layout', () => {
    expect(sceneSpan(screen({ layout: 'panorama' }), DEFAULT_SETTINGS)).toBe(2)
  })
})

describe('arrangements', () => {
  it('every arrangement places at least one device', () => {
    for (const pos of POSITIONS) expect(pos.placements.length).toBeGreaterThan(0)
  })
})
