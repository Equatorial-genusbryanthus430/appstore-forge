import { useCallback, useRef, useState } from 'react'
import { ScreenCard } from './components/ScreenCard'
import { Sidebar } from './components/Sidebar'
import { TemplatesPage } from './components/TemplatesPage'
import { TopBar } from './components/TopBar'
import { desktop, exportAll, type ExportResult } from './lib/export'
import { getSize } from './presets/sizes'
import { getTemplateSpec } from './presets/templates'
import { slotCount, useStore } from './store'

const PREVIEW_WIDTH = 230

export function App() {
  const screens = useStore((s) => s.screens)
  const images = useStore((s) => s.images)
  const settings = useStore((s) => s.settings)
  const format = useStore((s) => s.format)
  const addFiles = useStore((s) => s.addFiles)
  const selectScreen = useStore((s) => s.selectScreen)
  const page = useStore((s) => s.page)
  const template = useStore((s) => getTemplateSpec(s.templateId))
  const slots = slotCount(template)
  const filled = screens.filter((s) => s.imageId !== null).length
  const missing = screens.length - filled

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Exclude<ExportResult, { kind: 'cancelled' }> | null>(null)

  const size = getSize(settings.sizeId)
  const previewHeight = Math.round((PREVIEW_WIDTH * size.h) / size.w)

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      void addFiles(Array.from(e.dataTransfer.files))
    },
    [addFiles],
  )

  const onExport = useCallback(async () => {
    setExporting(true)
    setError(null)
    setResult(null)
    try {
      const outcome = await exportAll(screens, settings, images, format)
      if (outcome.kind !== 'cancelled') setResult(outcome)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }, [screens, settings, images, format])

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      {page === 'templates' ? (
        <TemplatesPage />
      ) : (
        <div className="flex min-h-0 flex-1">
          <Sidebar onExport={onExport} exporting={exporting} />

          <main
            className="relative flex-1 overflow-auto"
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                void addFiles(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />

            {screens.length === 0 ? (
              <div className="flex h-full items-center justify-center p-10">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-8 py-16"
                  style={{
                    borderColor: dragging ? 'var(--accent)' : 'var(--line)',
                    background: dragging ? 'rgba(30,111,245,0.04)' : 'transparent',
                  }}
                >
                  <span className="text-[15px] font-semibold">Drop your app screenshots here</span>
                  <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                    PNGs straight from the simulator or a real device — or click to browse. Add as many as you
                    like, or pick a template first.
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex min-h-full flex-col p-8" onClick={() => selectScreen(null)}>
                <div className="flex items-center justify-between pb-5">
                  <div className="text-[13px]" style={{ color: 'var(--muted)' }}>
                    {slots > 0 ? (
                      <>
                        <span className="font-medium" style={{ color: 'var(--ink)' }}>
                          {template.label}
                        </span>{' '}
                        · {filled} of {screens.length} screenshots added
                        {missing > 0 && (
                          <span style={{ color: 'var(--accent)' }}>
                            {' '}
                            — this template needs {missing} more
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {screens.length} screenshot{screens.length === 1 ? '' : 's'}
                      </>
                    )}{' '}
                    · {size.w}×{size.h} · {size.store}
                  </div>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-[12px] font-medium"
                    style={{ borderColor: 'var(--line)', background: '#fff' }}
                    onClick={() => inputRef.current?.click()}
                  >
                    {missing > 0 ? `Add ${missing} screenshot${missing === 1 ? '' : 's'}` : 'Add more'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-5" onClick={(e) => e.stopPropagation()}>
                  {screens.map((screen, i) => (
                    <ScreenCard
                      key={screen.id}
                      screen={screen}
                      index={i}
                      total={screens.length}
                      isSlot={i < slots}
                      width={PREVIEW_WIDTH}
                      height={previewHeight}
                    />
                  ))}
                </div>
              </div>
            )}

            {dragging && screens.length > 0 && (
              <div
                className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-dashed"
                style={{
                  borderColor: 'var(--accent)',
                  background: 'rgba(30,111,245,0.04)',
                }}
              />
            )}

            {result && (
              <div className="toast">
                <span>
                  {result.kind === 'saved'
                    ? `Saved ${result.count} screenshot${result.count === 1 ? '' : 's'} to ${result.dir.split('/').slice(-1)[0]}`
                    : `Downloaded ${result.count} screenshot${result.count === 1 ? '' : 's'}`}
                </span>
                {result.kind === 'saved' && (
                  <button onClick={() => void desktop()?.revealPath(result.dir)}>Show in Finder</button>
                )}
                <button onClick={() => setResult(null)}>Dismiss</button>
              </div>
            )}

            {error && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-[12px] text-white">
                {error}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
