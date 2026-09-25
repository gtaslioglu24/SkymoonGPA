/**
 * Applies the saved (or system) theme before the first paint.
 *
 * React can only set the `dark` class once it has mounted, which is after the
 * browser has already painted the light theme — dark-mode users saw a white
 * flash on every load. This runs synchronously in <head> instead.
 *
 * Kept as a separate file, not an inline <script>, so the page's CSP can stay
 * at `script-src 'self'` with no 'unsafe-inline' and no hash to keep in sync.
 */
(function () {
  try {
    var saved = window.localStorage.getItem('skymoon-gpa:theme');
    var dark =
      saved === 'dark' ||
      (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch {
    /* private mode / storage disabled — light theme is a fine default */
  }
})();
