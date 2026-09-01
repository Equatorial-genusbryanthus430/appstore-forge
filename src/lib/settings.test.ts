import { describe, expect, it } from 'vitest'
import { SECTION_KEYS, effectiveSettings, isOverridden } from './settings'
import { DEFAULT_SETTINGS } from '../store'
import type { OverridableKey, Screen } from '../types'

const screen = (overrides: Screen['overrides'] = {}): Screen => ({
  id: 'test',
  headline: '',
  subhead: '',
  imageId: null,
  overrides,
})

describe('effectiveSettings', () => {
  it('falls through to the global settings when nothing is overridden', () => {
    expect(effectiveSettings(screen(), DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS)
  })

  it("lets a screen's own value win", () => {
    const resolved = effectiveSettings(screen({ tilt: 8 }), DEFAULT_SETTINGS)
    expect(resolved.tilt).toBe(8)
    expect(resolved.layout).toBe(DEFAULT_SETTINGS.layout)
  })

  it('does not mutate either input', () => {
    const global = { ...DEFAULT_SETTINGS }
    const s = screen({ tilt: 8 })
    effectiveSettings(s, global)
    expect(global).toEqual(DEFAULT_SETTINGS)
    expect(s.overrides).toEqual({ tilt: 8 })
  })
})

describe('isOverridden', () => {
  it('is false with no screen selected', () => {
    expect(isOverridden(null, 'tilt')).toBe(false)
  })

  it('tracks exactly which key the screen pins', () => {
    const s = screen({ tilt: 8 })
    expect(isOverridden(s, 'tilt')).toBe(true)
    expect(isOverridden(s, 'layout')).toBe(false)
  })
})

describe('SECTION_KEYS', () => {
  const listed = Object.values(SECTION_KEYS).flat()

  it('reaches every overridable setting, so nothing is unresettable', () => {
    const all = (Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]).filter(
      (k) => k !== 'sizeId',
    ) as OverridableKey[]
    expect([...listed].sort()).toEqual([...all].sort())
  })

  it('assigns each key to exactly one section', () => {
    expect(new Set(listed).size).toBe(listed.length)
  })
})
