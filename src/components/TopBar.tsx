import { useStore, type Page } from '../store'

const PAGES: { id: Page; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'editor', label: 'Editor' },
]

export function TopBar() {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)
  return (
    <header className="topbar">
      <div className="flex items-baseline gap-2">
        <span className="text-[14px] font-semibold tracking-tight">AppStore Forge</span>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
          v{__APP_VERSION__}
        </span>
      </div>
      <nav className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--shell)' }}>
        {PAGES.map((p) => (
          <button key={p.id} className="tab" data-active={page === p.id} onClick={() => setPage(p.id)}>
            {p.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
