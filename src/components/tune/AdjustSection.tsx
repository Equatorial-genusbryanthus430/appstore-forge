import { Row } from './Controls'
import type { SectionProps } from './shared'

/** Final nudges to the device frame itself: rotation and size. */
export function AdjustSection({ settings, put }: SectionProps) {
  return (
    <>
      <Row label={`Tilt ${settings.tilt}°`}>
        <input
          type="range"
          min={-15}
          max={15}
          value={settings.tilt}
          onChange={(e) => put({ tilt: Number(e.target.value) })}
        />
      </Row>
      <Row label={`Scale ${settings.deviceScale.toFixed(2)}`}>
        <input
          type="range"
          min={0.7}
          max={1.2}
          step={0.01}
          value={settings.deviceScale}
          onChange={(e) => put({ deviceScale: Number(e.target.value) })}
        />
      </Row>
    </>
  )
}
