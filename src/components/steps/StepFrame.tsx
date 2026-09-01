/** Shared header for a step: what to do here, and why it matters for the store. */
export function StepFrame({
  title,
  lead,
  aside,
  children,
}: {
  title: string
  lead: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {lead}
          </p>
        </div>
        {aside}
      </div>
      {children}
    </div>
  )
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="tip">
      <span className="tip-mark" aria-hidden>
        i
      </span>
      <span>{children}</span>
    </div>
  )
}
