import { useState } from 'react'
import { GRADIENT_PRESETS, SOLID_PRESETS } from '../../presets/backgrounds'
import type { Background } from '../../types'
import { Row } from './Controls'
import { gradientCss, type SectionProps } from './shared'

/** Background and the optional rounded backdrop card behind the device band. */
export function BackgroundSection({ settings, put }: SectionProps) {
  const [tab, setTab] = useState<'presets' | 'custom'>('presets')
  const bg = settings.background
  // Switching to Custom on a solid background needs a gradient to start from.
  const custom: Extract<Background, { kind: 'gradient' }> =
    bg.kind === 'gradient' ? bg : { kind: 'gradient', from: '#6366f1', to: '#a855f7', angle: 135 }

  return (
    <>
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
              onClick={() =>
                put({ background: { kind: 'solid', color: bg.kind === 'solid' ? bg.color : custom.from } })
              }
            >
              Solid
            </button>
            <button
              className="seg"
              data-active={bg.kind === 'gradient'}
              onClick={() => put({ background: custom })}
            >
              Gradient
            </button>
          </div>

          {bg.kind === 'solid' ? (
            <Row label="Color">
              <input
                type="color"
                value={bg.color}
                onChange={(e) => put({ background: { kind: 'solid', color: e.target.value } })}
              />
              <input
                className="field"
                value={bg.color}
                onChange={(e) => put({ background: { kind: 'solid', color: e.target.value } })}
              />
            </Row>
          ) : (
            <>
              <Row label="From">
                <input
                  type="color"
                  value={bg.from}
                  onChange={(e) => put({ background: { ...bg, from: e.target.value } })}
                />
                <input
                  className="field"
                  value={bg.from}
                  onChange={(e) => put({ background: { ...bg, from: e.target.value } })}
                />
              </Row>
              <Row label="To">
                <input
                  type="color"
                  value={bg.to}
                  onChange={(e) => put({ background: { ...bg, to: e.target.value } })}
                />
                <input
                  className="field"
                  value={bg.to}
                  onChange={(e) => put({ background: { ...bg, to: e.target.value } })}
                />
              </Row>
              <Row label={`${bg.angle}°`}>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={bg.angle}
                  onChange={(e) => put({ background: { ...bg, angle: Number(e.target.value) } })}
                />
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
    </>
  )
}
