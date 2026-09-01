import { TEMPLATES } from '../../presets/templates'
import { getSize } from '../../presets/sizes'
import { useStore } from '../../store'
import { RhythmOptions } from '../RhythmPicker'
import { TemplateTile } from '../TemplateTile'
import { StepFrame, Tip } from './StepFrame'

const TILE_WIDTH = 88

/** Template (the look) and rhythm (where the phone sits on each tile) — chosen separately. */
export function LookStep() {
  const templateId = useStore((s) => s.templateId)
  const applyTemplate = useStore((s) => s.applyTemplate)
  const sizeId = useStore((s) => s.settings.sizeId)
  const screenCount = useStore((s) => s.screens.length)
  const size = getSize(sizeId)
  const tileHeight = Math.round((TILE_WIDTH * size.h) / size.w)

  return (
    <StepFrame
      title="Pick a look"
      lead="A template sets colours, type and composition for the whole set. A set template also fixes how many screenshots it wants; Classic takes any number. Your screenshots and headlines are kept when you switch."
    >
      <section className="flex flex-col gap-3">
        <h2 className="label">Template</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(560px, 1fr))' }}>
          {TEMPLATES.map((t) => (
            <TemplateTile
              key={t.id}
              template={t}
              width={TILE_WIDTH}
              height={tileHeight}
              active={templateId === t.id}
              onApply={() => applyTemplate(t.id)}
            />
          ))}
        </div>
        {screenCount > 0 && (
          <Tip>
            Previews use your own screenshots. Write <code>*word*</code> in a headline to highlight it.
          </Tip>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label">Rhythm</h2>
        <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
          The sequence of compositions across the strip. Changes only where the phone and copy sit; colours
          stay.
        </p>
        <RhythmOptions />
      </section>
    </StepFrame>
  )
}
