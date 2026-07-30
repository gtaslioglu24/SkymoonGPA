import { useState } from 'react';
import { useI18n } from './lib/i18n';
import { Header } from './components/Header';
import { InfoPanel } from './components/InfoPanel';
import { ProjectionTab } from './components/tabs/ProjectionTab';
import { ScratchTab } from './components/tabs/ScratchTab';
import { TargetTab } from './components/tabs/TargetTab';
import { SemestersTab } from './components/tabs/SemestersTab';
import { cx } from './components/ui';

type TabKey = 'projection' | 'scratch' | 'semesters' | 'target';

function App() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabKey>('projection');

  const tabs: TabKey[] = ['projection', 'scratch', 'semesters', 'target'];

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
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

      {/* Tab nav */}
      <nav className="mt-10 flex gap-6 overflow-x-auto border-b border-line pb-px dark:border-ink-line">
        {tabs.map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cx(
                'relative -mb-px shrink-0 whitespace-nowrap pb-3 text-sm font-medium transition',
                active
                  ? 'text-stone-900 dark:text-stone-50'
                  : 'text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200',
              )}
            >
              {t.tabs[key]}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-stone-900 dark:bg-stone-100" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Active tab */}
      <div key={tab} className="mt-7 animate-fade">
        {tab === 'projection' && <ProjectionTab />}
        {tab === 'scratch' && <ScratchTab />}
        {tab === 'semesters' && <SemestersTab />}
        {tab === 'target' && <TargetTab />}
      </div>

      <InfoPanel />

      {/* Footer */}
      <footer className="mt-10 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between dark:border-ink-line">
        <p className="max-w-lg text-xs leading-relaxed text-stone-400 dark:text-stone-500">
          {t.info.disclaimer}
        </p>
        <p className="shrink-0 text-xs text-stone-400 dark:text-stone-500">
          © {new Date().getFullYear()} <span className="font-serif text-stone-500 dark:text-stone-400">Skymoon Studios</span> · {t.footer.rights}
        </p>
      </footer>
    </div>
  );
}

export default App;
