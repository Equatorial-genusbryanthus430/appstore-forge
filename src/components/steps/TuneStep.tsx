import { getSize } from '../../presets/sizes'
import { getTemplateSpec } from '../../presets/templates'
import { slotCount, useStore } from '../../store'
import { ScreenCard } from '../ScreenCard'
import { TunePanel } from '../TunePanel'
import { StepFrame } from './StepFrame'

const PREVIEW_WIDTH = 200

/** The full control set, scoped to every screen or to the one you click. Optional. */
export function TuneStep() {
  const screens = useStore((s) => s.screens)
  const settings = useStore((s) => s.settings)
  const template = useStore((s) => getTemplateSpec(s.templateId))
  const selectScreen = useStore((s) => s.selectScreen)
  const size = getSize(settings.sizeId)
  const previewHeight = Math.round((PREVIEW_WIDTH * size.h) / size.w)
  const slots = slotCount(template)

  return (
    <StepFrame
      title="Fine-tune"
      lead="Everything the template decided is adjustable. Change all screens at once, or click one screen to change only that one — it keeps its own settings when you edit the rest."
    >
      <div className="flex items-start gap-6">
        <TunePanel />
        <div className="flex min-w-0 flex-1 flex-wrap gap-4" onClick={() => selectScreen(null)}>
          {screens.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
              Add screenshots to see the controls take effect. Global changes still apply to screens you add later.
            </p>
          ) : (
            screens.map((screen, i) => (
              <ScreenCard key={screen.id} screen={screen} index={i} total={screens.length} isSlot={i < slots} width={PREVIEW_WIDTH} height={previewHeight} compact />
            ))
          )}
        </div>
      </div>
    </StepFrame>
  )
}
