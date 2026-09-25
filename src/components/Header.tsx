import { useI18n, type Lang } from '../lib/i18n';
import { useTheme } from '../lib/hooks';
import { IconButton, Segmented } from './ui';

/**
 * Skymoon mark — logo zoomed to the subject in a rounded cream tile.
 * Served at 96px (2× the 48px tile) instead of the 512px master: the original
 * cost 244 KB to paint a 48-pixel square.
 */
function Logo() {
  return (
    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#f7f4ec] ring-1 ring-black/5 dark:ring-white/10">
      <img
        src="/logo-96.webp"
        alt=""
        width={96}
        height={96}
        decoding="async"
        className="h-full w-full object-contain"
        style={{ transform: 'scale(1.25)' }}
      />
    </div>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <Logo />
        <div className="font-serif text-lg font-medium leading-none text-stone-900 dark:text-stone-50">
          {t.app.title}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Segmented<Lang>
          size="sm"
          aria-label={t.common.language}
          value={lang}
          onChange={setLang}
          options={[
            { value: 'tr', label: 'TR' },
            { value: 'en', label: 'EN' },
          ]}
        />
        <IconButton
          onClick={toggle}
          aria-label={theme === 'dark' ? t.common.themeToLight : t.common.themeToDark}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </IconButton>
      </div>
    </header>
  );
}
