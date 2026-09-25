import { useState } from 'react';
import { FEEDBACK_URL } from '../lib/config';
import { useI18n } from '../lib/i18n';
import { clearAppData } from '../lib/storage';
import { Button } from './ui';

/**
 * Disclaimer, the privacy claim, and the control that makes the claim testable.
 *
 * The grades typed in here are academic personal data sitting in localStorage
 * indefinitely — on a shared library machine the next person can read them.
 * "Nothing leaves your device" is only reassuring next to a visible way to
 * delete what stayed on it.
 */
export function PrivacyFooter() {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  const wipe = () => {
    clearAppData();
    window.location.reload();
  };

  return (
    <footer className="mt-10 border-t border-line pt-5 dark:border-ink-line">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-lg space-y-2">
          <p className="text-xs leading-relaxed text-muted">{t.info.disclaimer}</p>
          <p className="text-xs leading-relaxed text-muted">
            <span aria-hidden="true">🔒 </span>
            {t.privacy.notice}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {confirming ? (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={wipe}
                className="px-3 py-1.5 text-xs"
              >
                {t.privacy.confirmClear}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 text-xs"
              >
                {t.privacy.cancel}
              </Button>
            </div>
          ) : (
            <Button
              variant="soft"
              onClick={() => setConfirming(true)}
              className="px-3 py-1.5 text-xs"
            >
              {t.privacy.clearData}
            </Button>
          )}

          {FEEDBACK_URL && (
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
            >
              {t.privacy.feedback} ↗
            </a>
          )}
        </div>
      </div>

      <p className="mt-5 text-xs text-muted">
        © {new Date().getFullYear()}{' '}
        <span className="font-serif">Skymoon Studios</span> · {t.footer.rights}
      </p>
    </footer>
  );
}
