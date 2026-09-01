import { readiness } from '../../lib/progress'
import { useStore } from '../../store'
import { StorePreview } from '../StorePreview'
import { StepFrame } from './StepFrame'

type Check = { ok: boolean; text: string; fix?: { label: string; step: 'shots' | 'copy' | 'target' } }

/** A readiness checklist against the store's rules, then the set on a mock product page. */
export function ReviewStep() {
  const screens = useStore((s) => s.screens)
  const settings = useStore((s) => s.settings)
  const format = useStore((s) => s.format)
  const setFormat = useStore((s) => s.setFormat)
  const setStep = useStore((s) => s.setStep)
  const r = readiness(screens, settings)

  const checks: Check[] = [
    r.total === 0
      ? { ok: false, text: 'No screenshots yet', fix: { label: 'Add screenshots', step: 'shots' } }
      : r.missingShots > 0
        ? { ok: false, text: `${r.missingShots} slot${r.missingShots === 1 ? '' : 's'} still empty`, fix: { label: 'Fill them', step: 'shots' } }
        : { ok: true, text: `All ${r.total} screenshots in place` },
    r.missingCopy > 0
      ? { ok: false, text: `${r.missingCopy} screen${r.missingCopy === 1 ? '' : 's'} without a headline`, fix: { label: 'Write copy', step: 'copy' } }
      : { ok: true, text: 'Every screen that shows copy has a headline' },
    r.overLimit
      ? { ok: false, text: `${r.tiles} tiles — ${r.store} accepts at most ${r.limit.max}`, fix: { label: 'Remove some', step: 'shots' } }
      : r.underMin
        ? { ok: false, text: `${r.tiles} tile — ${r.store} wants at least ${r.limit.min}`, fix: { label: 'Add more', step: 'shots' } }
        : { ok: true, text: `${r.tiles} tile${r.tiles === 1 ? '' : 's'} — within ${r.store}'s ${r.limit.min}–${r.limit.max}` },
    r.store === 'App Store' && format === 'png'
      ? { ok: false, text: 'PNG carries an alpha channel; App Store Connect can reject it', fix: { label: 'Use JPEG', step: 'target' } }
      : { ok: true, text: format === 'jpeg' ? 'JPEG — no alpha channel, accepted everywhere' : 'PNG is fine for Google Play' },
  ]

  return (
    <StepFrame
      title="Review & export"
      lead="A last look at the set the way shoppers will see it, and the store rules checked before you upload."
      aside={
        <div className="flex items-center gap-2">
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
            Format
          </span>
          <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
            <button className="seg" data-active={format === 'png'} onClick={() => setFormat('png')}>
              PNG
            </button>
            <button className="seg" data-active={format === 'jpeg'} onClick={() => setFormat('jpeg')}>
              JPEG
            </button>
          </div>
        </div>
      }
    >
      <ul className="checklist">
        {checks.map((c) => (
          <li key={c.text} data-ok={c.ok}>
            <span className="check-mark" aria-hidden>
              {c.ok ? '✓' : '!'}
            </span>
            <span className="flex-1 text-[13px]">{c.text}</span>
            {!c.ok && c.fix && (
              <button className="linkish" onClick={() => (c.fix!.step === 'target' ? setFormat('jpeg') : setStep(c.fix!.step))}>
                {c.fix.label}
              </button>
            )}
          </li>
        ))}
      </ul>
      <StorePreview />
    </StepFrame>
  )
}
