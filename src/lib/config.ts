/**
 * Build-time configuration. Everything here is public, non-secret metadata.
 *
 * The canonical origin lives in exactly one place (`.env` → `VITE_SITE_URL`) so
 * that canonical/OG/sitemap URLs can never drift apart or, worse, keep pointing
 * at a domain someone else owns.
 */

const rawSiteUrl = import.meta.env.VITE_SITE_URL?.trim();

/** Canonical origin, without a trailing slash. */
export const SITE_URL = (rawSiteUrl || 'http://localhost:5173').replace(/\/+$/, '');

/**
 * Plausible domain. Empty = analytics disabled (the default). Set it in `.env`
 * to switch analytics on; nothing third-party loads until you do.
 */
export const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() || '';

/**
 * Where users report a wrong number. Leave empty to hide the link — better no
 * link than a dead one. A GitHub issues URL or a `mailto:` both work.
 */
export const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL?.trim() || '';

/**
 * When the grading rules encoded in `grades.ts` were last checked against the
 * Registrar's published documents. Shown in the UI: a rules-based calculator
 * that can't say when it was last verified is asking for blind trust.
 *
 * Last pass checked the letter scale, the honour-list thresholds and the repeat
 * rule line by line against an official YÖK "Not Döküm Belgesi" issued in
 * September 2026. The scale matched; the honour thresholds and the repeat rule
 * did not, and were corrected to the document.
 */
export const RULES_VERIFIED_ON = '2026-09-26';

/** Official sources for the numbers this app encodes. */
export const SOURCES: { label: string; url: string }[] = [
  {
    label: 'Koç University — Grading Scale (Academic Council 2020/07)',
    url: 'https://cssh.ku.edu.tr/en/about/faculty-resources/grading-scale/',
  },
  {
    label: 'Koç University — Registrar’s and Student Affairs Directorate',
    url: 'https://registrar.ku.edu.tr/en/',
  },
];
