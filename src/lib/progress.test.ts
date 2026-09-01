import { describe, expect, it } from 'vitest'
import { readiness } from './progress'
import { DEFAULT_SETTINGS } from '../store'
import type { Screen, ScreenOverrides } from '../types'

const screen = (imageId: string | null, headline = 'Head', overrides: ScreenOverrides = {}): Screen => ({
  id: Math.random().toString(36),
  headline,
  subhead: '',
  imageId,
  overrides,
})

describe('readiness', () => {
  it('cannot export an empty set', () => {
    expect(readiness([], DEFAULT_SETTINGS).canExport).toBe(false)
  })

  it('cannot export while a slot is still empty', () => {
    const r = readiness([screen('a'), screen(null)], DEFAULT_SETTINGS)
    expect(r.missingShots).toBe(1)
    expect(r.canExport).toBe(false)
  })

  it('can export once every slot is filled', () => {
    const r = readiness([screen('a'), screen('b')], DEFAULT_SETTINGS)
    expect(r).toMatchObject({ total: 2, filled: 2, missingShots: 0, canExport: true })
  })

  it('counts a screen whose layout shows copy but has no headline', () => {
    expect(readiness([screen('a', '   ')], DEFAULT_SETTINGS).missingCopy).toBe(1)
  })

  it('does not ask for copy on a device-only layout', () => {
    const r = readiness([screen('a', '', { layout: 'centered' })], DEFAULT_SETTINGS)
    expect(r.missingCopy).toBe(0)
  })

  it('missing copy is advice, not a gate on export', () => {
    expect(readiness([screen('a', '')], DEFAULT_SETTINGS).canExport).toBe(true)
  })

  it('counts a panorama as the two store tiles it becomes', () => {
    const r = readiness([screen('a', 'Head', { layout: 'panorama' })], DEFAULT_SETTINGS)
    expect(r.total).toBe(1)
    expect(r.tiles).toBe(2)
  })

  it('flags a set over the App Store limit of ten tiles', () => {
    const screens = Array.from({ length: 11 }, () => screen('a'))
    expect(readiness(screens, DEFAULT_SETTINGS).overLimit).toBe(true)
  })

  it('flags a Google Play set under its two-tile minimum', () => {
    const play = { ...DEFAULT_SETTINGS, sizeId: 'android-phone' }
    const r = readiness([screen('a')], play)
    expect(r.store).toBe('Google Play')
    expect(r.underMin).toBe(true)
  })

  it('does not call an empty set under the minimum — there is nothing to warn about yet', () => {
    const play = { ...DEFAULT_SETTINGS, sizeId: 'android-phone' }
    expect(readiness([], play).underMin).toBe(false)
  })
})
