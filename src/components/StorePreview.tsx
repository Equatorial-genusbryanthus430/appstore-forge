import { sceneSpan } from '../render/scene'
import { getSize } from '../presets/sizes'
import { useStore } from '../store'
import { ScreenPreview } from './ScreenPreview'

/** Store tile width on the mock product page — roughly what the App Store web page shows. */
const TILE = 196

/**
 * The set inside a mock App Store product page. The chrome around the strip is what tells you
 * whether a headline still reads at gallery size; a panorama shows as the two separate tiles
 * with the store's gap between them, exactly as it will upload.
 */
export function StorePreview() {
  const screens = useStore((s) => s.screens)
  const settings = useStore((s) => s.settings)
  const listing = useStore((s) => s.listing)
  const setListing = useStore((s) => s.setListing)
  const size = getSize(settings.sizeId)
  const tileH = Math.round((TILE * size.h) / size.w)
  const gap = 10

  return (
    <div className="store">
      <div className="store-head">
        <div className="store-icon" aria-hidden />
        <div className="min-w-0 flex-1">
          <input
            className="store-name"
            value={listing.name}
            placeholder="App name"
            onChange={(e) => setListing({ name: e.target.value })}
          />
          <input
            className="store-sub"
            value={listing.subtitle}
            placeholder="Subtitle — under 30 characters"
            onChange={(e) => setListing({ subtitle: e.target.value })}
          />
          <div className="mt-2 flex items-center gap-3">
            <span className="store-get">GET</span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              In-App Purchases
            </span>
          </div>
        </div>
      </div>

      <div className="store-stats">
        {[
          ['4.8', '★★★★★', '1.2K Ratings'],
          ['#12', '', listing.category || 'Productivity'],
          ['4+', '', 'Age'],
          [listing.developer || 'Developer', '', 'Developer'],
        ].map(([big, mid, small]) => (
          <div key={small} className="store-stat">
            <div className="store-stat-big">{big}</div>
            {mid && <div className="store-stat-mid">{mid}</div>}
            <div className="store-stat-small">{small}</div>
          </div>
        ))}
      </div>

      <div className="store-section">Preview</div>
      <div className="flex overflow-x-auto pb-3" style={{ gap }}>
        {screens.map((screen) => {
          const span = sceneSpan(screen, settings)
          return (
            <div key={screen.id} className="flex shrink-0" style={{ gap }}>
              {Array.from({ length: span }, (_, part) => (
                <div key={part} className="overflow-hidden rounded-xl" style={{ width: TILE, height: tileH }}>
                  <div style={{ marginLeft: -part * TILE }}>
                    <ScreenPreview screen={screen} width={TILE} height={tileH} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="store-section">Description</div>
      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted)', maxWidth: 560 }}>
        Two or three short paragraphs in the store's voice go here. This page is a stand-in for the App
        Store product page so you can judge the strip at the size shoppers actually see it.
      </p>
    </div>
  )
}
