import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from './lib/i18n';
import { Header } from './components/Header';
import { InfoPanel } from './components/InfoPanel';
import { PrivacyFooter } from './components/PrivacyFooter';
import { ProjectionTab } from './components/tabs/ProjectionTab';
import { ScratchTab } from './components/tabs/ScratchTab';
import { TargetTab } from './components/tabs/TargetTab';
import { SemestersTab } from './components/tabs/SemestersTab';
import { cx } from './lib/cx';

type TabKey = 'projection' | 'scratch' | 'semesters' | 'target';

const TABS: TabKey[] = ['projection', 'scratch', 'semesters', 'target'];

function App() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabKey>('projection');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Which ends of the tab strip have more content behind them. The scrollbar is
  // hidden, so without this a cut-off tab at the screen edge just looks broken
  // instead of swipeable. Both start false: the common case is a strip that
  // fits, and a fade on a strip with nothing to scroll to is a lie.
  const stripRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measureEdges = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // A pixel of slack: fractional layout widths leave sub-pixel scroll room on
    // a strip that is, to the eye, fully visible.
    setEdges({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    measureEdges();
    const el = stripRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    // Rotation, a window resize and a language switch all change how much of
    // the strip fits; the tab labels are longer in one language than the other.
    const ro = new ResizeObserver(measureEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureEdges, t]);

  /** Arrow-key navigation, as the WAI-ARIA tabs pattern expects. */
  const onKeyDown = (e: KeyboardEvent) => {
    const i = TABS.indexOf(tab);
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    const key = TABS[next];
    setTab(key);

    // Bring the tab into view by hand. Plain `focus()` doesn't reliably scroll
    // the strip horizontally, and with the scrollbar hidden an off-screen
    // focused tab leaves a keyboard user with no idea where they are. Both
    // options are `nearest` so this only ever scrolls the strip sideways — the
    // page must not jump vertically. Omitting `behavior` inherits CSS
    // `scroll-behavior`, which the reduced-motion query already turns off.
    const el = tabRefs.current[key];
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-9 lg:pb-9">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t.common.skipToContent}
      </a>

      <Header />

      {/* Hero */}
      <div className="mt-12">
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-400">
          Koç Üniversitesi
        </div>
        <h1 className="mt-3 font-serif text-[2rem] font-medium leading-[1.05] text-stone-900 sm:text-[2.6rem] md:whitespace-nowrap dark:text-stone-50">
          {t.app.tagline}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-300">
          {t.app.subtitle}
        </p>
      </div>

      <main id="main">
        {/* Tab nav.

            The hairline lives on the wrapper, not the scroller, and the active
            marker is the button's own bottom border rather than an absolutely
            positioned bar hanging 1px below it. That bar used to overflow the
            scroll container vertically — and because `overflow-x: auto` forces
            `overflow-y` to compute to `auto` too, the strip picked up a stray
            couple of pixels of vertical scroll. Nothing overflows now, so
            `overflow-y-hidden` costs nothing and pins the axis shut.

            `overscroll-contain` keeps a swipe over the strip from chaining into
            the document: the vertical component of a trackpad gesture used to
            nudge the whole page, which reads as the strip drifting up and down
            and flashes the page's scrollbar. `no-scrollbar` hides the
            horizontal bar — on platforms with classic scrollbars it was also
            stealing ~15px from inside the strip and clipping the underline. */}
        <div className="relative mt-10 border-b border-line dark:border-ink-line">
          <nav
            ref={stripRef}
            role="tablist"
            aria-label={t.common.tabsLabel}
            onKeyDown={onKeyDown}
            onScroll={measureEdges}
            className="no-scrollbar -mb-px flex gap-6 overflow-x-auto overflow-y-hidden overscroll-contain pt-1"
          >
            {TABS.map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  id={`tab-${key}`}
                  ref={(el) => {
                    tabRefs.current[key] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${key}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(key)}
                  // Inset focus ring: an outset one would be clipped by the
                  // scroll container on the very tabs you reach by keyboard.
                  className={cx(
                    'shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition focus-visible:[outline-offset:-2px]',
                    active
                      ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-50'
                      : 'border-transparent text-muted hover:text-stone-700 dark:hover:text-stone-200',
                  )}
                >
                  {t.tabs[key]}
                </button>
              );
            })}
          </nav>

          {/* Purely decorative, and outside the scroller so they don't ride
              along with it. aria-hidden: a screen reader already knows the full
              tab list; a fade is a visual hint about a scrollbar it can't see. */}
          <div className="scroll-fade scroll-fade-start" data-visible={edges.start} aria-hidden="true" />
          <div className="scroll-fade scroll-fade-end" data-visible={edges.end} aria-hidden="true" />
        </div>

        {/* Active tab */}
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className="mt-7 animate-fade focus:outline-none"
        >
          {tab === 'projection' && <ProjectionTab />}
          {tab === 'scratch' && <ScratchTab />}
          {tab === 'semesters' && <SemestersTab />}
          {tab === 'target' && <TargetTab />}
        </div>
      </main>

      <InfoPanel />
      <PrivacyFooter />
    </div>
  );
}

export default App;
