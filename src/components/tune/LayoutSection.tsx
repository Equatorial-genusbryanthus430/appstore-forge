import { LAYOUTS } from '../../presets/layouts'
import { POSITIONS } from '../../presets/positions'
import { Row } from './Controls'
import type { SectionProps } from './shared'

/** The composition: which band holds the copy, and how many devices sit in the frame. */
export function LayoutSection({ settings, put }: SectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5">
        {LAYOUTS.map((t) => {
          const active = settings.layout === t.id
          return (
            <button
              key={t.id}
              className="rounded-lg border px-2 py-2 text-[12px]"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--line)',
                color: active ? 'var(--accent)' : 'var(--ink)',
                background: active ? 'rgba(30,111,245,0.06)' : '#fff',
              }}
              onClick={() => put({ layout: t.id })}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <Row label="Devices">
        <select
          className="field"
          value={settings.positionId}
          onChange={(e) => put({ positionId: e.target.value })}
        >
          {POSITIONS.map((pos) => (
            <option key={pos.id} value={pos.id}>
              {pos.label}
            </option>
          ))}
        </select>
      </Row>
    </>
  )
}
