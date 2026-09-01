import { useState } from 'react'
import { GRADIENT_PRESETS, SOLID_PRESETS } from '../presets/backgrounds'
import { DEVICES, DEVICE_GROUPS, FRAME_COLORS } from '../presets/devices'
import { POSITIONS } from '../presets/positions'
import { LAYOUTS } from '../presets/layouts'
import { FONTS, getFont } from '../presets/fonts'
import { SECTION_KEYS, effectiveSettings } from '../lib/settings'
import { useStore } from '../store'
import type { Background, OverridableKey, ScreenOverrides, Settings } from '../types'

const gradientCss = (g: Extract<Background, { kind: 'gradient' }>) =>
  `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[12px]" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function Section({
  id,
  title,
  defaultOpen = true,
  overridden = false,
  onReset,
  children,
}: {
  id: string
  title: string
  defaultOpen?: boolean
  overridden?: boolean
  onReset?: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(`section:${id}`)
      return saved === null ? defaultOpen : saved === '1'
    } catch {
      return defaultOpen
    }
  })

  // The write stays OUT of the state updater: React may invoke an updater more than once,
  // and a second invocation would see the already-flipped value and persist the opposite.
  const toggle = () => {
    const next = !open
    setOpen(next)
    try {
      localStorage.setItem(`section:${id}`, next ? '1' : '0')
    } catch {
      /* private mode — the section still toggles, it just won't be remembered */
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--line)' }}>
      <button className="section-head" onClick={toggle} aria-expanded={open}>
        <span className="flex items-center gap-1.5">
          <span className="label">{title}</span>
          {overridden && <span className="dot" title="Set for this screen only" />}
        </span>
        <svg className="chev" data-open={open} width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="flex flex-col gap-2.5 px-4 pb-4">
          {children}
          {overridden && onReset && (
            <button className="linkish" onClick={onReset}>
              Reset to all screens
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Fine-tune controls. Reads the resolved value for the selected screen (or the global set) and
 * writes back to that scope; each section shows a dot when the selected screen overrides it.
 */
export function TunePanel() {
  const global = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const screens = useStore((s) => s.screens)
  const selectedId = useStore((s) => s.selectedId)
  const selectScreen = useStore((s) => s.selectScreen)
  const setOverride = useStore((s) => s.setOverride)
  const clearOverrides = useStore((s) => s.clearOverrides)
  const clearAllOverrides = useStore((s) => s.clearAllOverrides)
  const [tab, setTab] = useState<'presets' | 'custom'>('presets')

  const selected = screens.find((s) => s.id === selectedId) ?? null
  const selectedIndex = screens.findIndex((s) => s.id === selectedId)
  const overrideCount = screens.filter((s) => Object.keys(s.overrides).length > 0).length

  // Controls read the resolved value and write to whichever scope is active.
  const settings: Settings = selected ? effectiveSettings(selected, global) : global
  const put = (patch: ScreenOverrides) =>
    selected ? setOverride(selected.id, patch) : setSettings(patch)
  const sectionOverridden = (key: string) =>
    !!selected && SECTION_KEYS[key]?.some((k) => selected.overrides[k] !== undefined)
  const resetSection = (key: string) => selected && clearOverrides(selected.id, SECTION_KEYS[key] as OverridableKey[])

  const bg = settings.background
  const custom: Extract<Background, { kind: 'gradient' }> =
    bg.kind === 'gradient' ? bg : { kind: 'gradient', from: '#6366f1', to: '#a855f7', angle: 135 }

  return (
    <aside
      className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto rounded-2xl border"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--shell)' }}>
          <button className="seg" data-active={!selected} onClick={() => selectScreen(null)}>
            All screens
          </button>
          <button className="seg" data-active={!!selected} disabled={!selected}>
            {selected ? `Screen ${selectedIndex + 1}` : 'No selection'}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
          {selected
            ? 'Changes apply to this screen only. Click the canvas background to go back to all screens.'
            : overrideCount > 0
              ? `Editing every screen. ${overrideCount} screen${overrideCount === 1 ? ' has' : 's have'} their own settings and will keep them.`
              : 'Click a screenshot to give it its own settings.'}
        </p>
        {!selected && overrideCount > 0 && (
          <button className="linkish mt-1.5" onClick={clearAllOverrides}>
            Reset all screens to these settings
          </button>
        )}
      </div>

      <Section id="background" title="Background" overridden={sectionOverridden('background')} onReset={() => resetSection('background')}>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--shell)' }}>
          <button className="seg" data-active={tab === 'presets'} onClick={() => setTab('presets')}>
            Presets
          </button>
          <button className="seg" data-active={tab === 'custom'} onClick={() => setTab('custom')}>
            Custom
          </button>
        </div>

        {tab === 'presets' ? (
          <>
            <div className="grid grid-cols-8 gap-1.5">
              {SOLID_PRESETS.map((color) => (
                <button
                  key={color}
                  className="swatch"
                  style={{ background: color }}
                  data-active={bg.kind === 'solid' && bg.color === color}
                  onClick={() => put({ background: { kind: 'solid', color } })}
                />
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.from + g.to}
                  className="swatch"
                  style={{ background: gradientCss(g) }}
                  data-active={bg.kind === 'gradient' && bg.from === g.from && bg.to === g.to}
                  onClick={() => put({ background: g })}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--shell)' }}>
              <button
                className="seg"
                data-active={bg.kind === 'solid'}
                onClick={() => put({ background: { kind: 'solid', color: bg.kind === 'solid' ? bg.color : custom.from } })}
              >
                Solid
              </button>
              <button className="seg" data-active={bg.kind === 'gradient'} onClick={() => put({ background: custom })}>
                Gradient
              </button>
            </div>

            {bg.kind === 'solid' ? (
              <Row label="Color">
                <input type="color" value={bg.color} onChange={(e) => put({ background: { kind: 'solid', color: e.target.value } })} />
                <input className="field" value={bg.color} onChange={(e) => put({ background: { kind: 'solid', color: e.target.value } })} />
              </Row>
            ) : (
              <>
                <Row label="From">
                  <input type="color" value={bg.from} onChange={(e) => put({ background: { ...bg, from: e.target.value } })} />
                  <input className="field" value={bg.from} onChange={(e) => put({ background: { ...bg, from: e.target.value } })} />
                </Row>
                <Row label="To">
                  <input type="color" value={bg.to} onChange={(e) => put({ background: { ...bg, to: e.target.value } })} />
                  <input className="field" value={bg.to} onChange={(e) => put({ background: { ...bg, to: e.target.value } })} />
                </Row>
                <Row label={`${bg.angle}°`}>
                  <input type="range" min={0} max={360} value={bg.angle} onChange={(e) => put({ background: { ...bg, angle: Number(e.target.value) } })} />
                </Row>
              </>
            )}
          </div>
        )}
        <Row label="Backdrop">
          <input
            type="color"
            value={settings.backdropColor ?? '#e8e0d0'}
            onChange={(e) => put({ backdropColor: e.target.value })}
          />
          <input
            className="field"
            value={settings.backdropColor ?? ''}
            placeholder="None"
            onChange={(e) => put({ backdropColor: e.target.value || null })}
          />
          {settings.backdropColor && (
            <button className="seg shrink-0" onClick={() => put({ backdropColor: null })}>
              Off
            </button>
          )}
        </Row>
      </Section>

      <Section id="device" title="Device frame" overridden={sectionOverridden('device')} onReset={() => resetSection('device')}>
        <select className="field" value={settings.deviceId} onChange={(e) => put({ deviceId: e.target.value })}>
          {DEVICE_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {DEVICES.filter((d) => d.group === group).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="grid grid-cols-8 gap-1.5">
          {FRAME_COLORS.map((c) => (
            <button
              key={c.id}
              title={c.label}
              className="swatch"
              style={{ background: `linear-gradient(140deg, ${c.edge}, ${c.body})` }}
              data-active={settings.frameColorId === c.id}
              onClick={() => put({ frameColorId: c.id })}
            />
          ))}
        </div>
      </Section>

      <Section id="layout" title="Layout" overridden={sectionOverridden('layout')} onReset={() => resetSection('layout')}>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUTS.map((t) => (
            <button
              key={t.id}
              className="rounded-lg border px-2 py-2 text-[12px]"
              style={{
                borderColor: settings.layout === t.id ? 'var(--accent)' : 'var(--line)',
                color: settings.layout === t.id ? 'var(--accent)' : 'var(--ink)',
                background: settings.layout === t.id ? 'rgba(30,111,245,0.06)' : '#fff',
              }}
              onClick={() => put({ layout: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Row label="Devices">
          <select className="field" value={settings.positionId} onChange={(e) => put({ positionId: e.target.value })}>
            {POSITIONS.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.label}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section id="type" title="Type" defaultOpen={false} overridden={sectionOverridden('type')} onReset={() => resetSection('type')}>
        <select
          className="field"
          style={{ fontFamily: getFont(settings.fontId).stack }}
          value={settings.fontId}
          onChange={(e) => put({ fontId: e.target.value })}
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
              {f.label}
            </option>
          ))}
        </select>
        <Row label={`Head ${Math.round(settings.headlineScale * 100)}%`}>
          <input type="range" min={0.6} max={1.8} step={0.05} value={settings.headlineScale} onChange={(e) => put({ headlineScale: Number(e.target.value) })} />
        </Row>
        <Row label={`Sub ${Math.round(settings.subheadScale * 100)}%`}>
          <input type="range" min={0.6} max={1.8} step={0.05} value={settings.subheadScale} onChange={(e) => put({ subheadScale: Number(e.target.value) })} />
        </Row>
        <Row label={`Track ${settings.headlineTracking >= 0 ? '+' : ''}${Math.round(settings.headlineTracking * 100)}`}>
          <input type="range" min={-0.06} max={0.06} step={0.005} value={settings.headlineTracking} onChange={(e) => put({ headlineTracking: Number(e.target.value) })} />
        </Row>
        <Row label="Align">
          <div className="flex flex-1 gap-1 rounded-lg p-1" style={{ background: 'var(--shell)' }}>
            <button className="seg" data-active={settings.textAlign === 'left'} onClick={() => put({ textAlign: 'left' })}>
              Left
            </button>
            <button className="seg" data-active={settings.textAlign === 'center'} onClick={() => put({ textAlign: 'center' })}>
              Center
            </button>
          </div>
        </Row>
        <Row label="Color">
          <input type="color" value={settings.textColor} onChange={(e) => put({ textColor: e.target.value })} />
          <input className="field" value={settings.textColor} onChange={(e) => put({ textColor: e.target.value })} />
        </Row>
        <Row label="Highlight">
          {[0, 1].map((i) => (
            <input
              key={i}
              type="color"
              title={`Highlight ${i + 1} — *starred* words cycle through these`}
              value={settings.highlights[i] ?? settings.highlights[0] ?? '#ffe27a'}
              onChange={(e) => {
                const next = [...settings.highlights]
                while (next.length <= i) next.push(next[0] ?? '#ffe27a')
                next[i] = e.target.value
                put({ highlights: next })
              }}
            />
          ))}
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            for <code>*words*</code>
          </span>
        </Row>
      </Section>

      <Section id="adjust" title="Adjust" defaultOpen={false} overridden={sectionOverridden('adjust')} onReset={() => resetSection('adjust')}>
        <Row label={`Tilt ${settings.tilt}°`}>
          <input type="range" min={-15} max={15} value={settings.tilt} onChange={(e) => put({ tilt: Number(e.target.value) })} />
        </Row>
        <Row label={`Scale ${settings.deviceScale.toFixed(2)}`}>
          <input type="range" min={0.7} max={1.2} step={0.01} value={settings.deviceScale} onChange={(e) => put({ deviceScale: Number(e.target.value) })} />
        </Row>
      </Section>

    </aside>
  )
}
