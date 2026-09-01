import { DEVICES, DEVICE_GROUPS, FRAME_COLORS } from '../../presets/devices'
import type { SectionProps } from './shared'

/** Which device frame the screenshots sit in, and what colour its body is. */
export function DeviceSection({ settings, put }: SectionProps) {
  return (
    <>
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
    </>
  )
}
