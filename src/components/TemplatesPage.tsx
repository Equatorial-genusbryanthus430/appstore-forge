import { TEMPLATES } from '../presets/templates'
import { getSize } from '../presets/sizes'
import { useStore } from '../store'
import { TemplateTile } from './TemplateTile'

const TILE_WIDTH = 210

/** Browse looks at a size you can judge; picking one applies it and drops you in the editor. */
export function TemplatesPage() {
  const templateId = useStore((s) => s.templateId)
  const applyTemplate = useStore((s) => s.applyTemplate)
  const setPage = useStore((s) => s.setPage)
  const sizeId = useStore((s) => s.settings.sizeId)
  const screenCount = useStore((s) => s.screens.length)
  const size = getSize(sizeId)
  const tileHeight = Math.round((TILE_WIDTH * size.h) / size.w)

  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-[20px] font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
          A set template lays out a fixed number of screens for you to fill; Classic is freeform — add as many
          screenshots as you like. Screenshots you already added are kept. Write <code>*word*</code> in a
          headline to highlight it.
          {screenCount > 0 && ' Previews use your first screenshot.'}
        </p>

        <div className="mt-6 grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_WIDTH + 24}px, 1fr))` }}>
          {TEMPLATES.map((t) => (
            <TemplateTile
              key={t.id}
              template={t}
              width={TILE_WIDTH}
              height={tileHeight}
              active={templateId === t.id}
              onApply={() => {
                applyTemplate(t.id)
                setPage('editor')
              }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
