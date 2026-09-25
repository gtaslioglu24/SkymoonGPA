import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Emit the service worker with a per-build cache name.
 *
 * It cannot live in `public/`: those files are copied verbatim, so the cache
 * name would be frozen across deploys and a returning visitor could be served a
 * stale shell pointing at asset filenames that no longer exist.
 */
function serviceWorker(): Plugin {
  return {
    name: 'skymoon-service-worker',
    apply: 'build',
    generateBundle() {
      const buildId = Date.now().toString(36)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: readFileSync('sw-template.js', 'utf8').replaceAll('__BUILD_ID__', buildId),
      })
    },
  }
}

/**
 * Everything that needs the absolute site URL, in one place.
 *
 * `public/` files are copied verbatim (no env substitution), so robots.txt and
 * sitemap.xml are emitted here from the same `VITE_SITE_URL` the HTML uses —
 * canonical, Open Graph, hreflang and sitemap can't drift apart.
 *
 * With no domain configured, the URL-bearing tags are removed rather than left
 * pointing at a placeholder: a canonical tag aimed at a domain you don't own
 * hands your search ranking to whoever does.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/+$/, '')

  return {
    name: 'skymoon-site-url',

    transformIndexHtml: {
      // 'post': the tags are appended after Vite's HTML pass, so its asset
      // resolver never tries to treat an absolute URL as a local file.
      order: 'post',
      handler() {
        if (!base) return []
        return [
          { tag: 'link', attrs: { rel: 'canonical', href: `${base}/` }, injectTo: 'head' },
          ...['tr', 'en', 'x-default'].map((hreflang) => ({
            tag: 'link',
            attrs: { rel: 'alternate', hreflang, href: `${base}/` },
            injectTo: 'head' as const,
          })),
          { tag: 'meta', attrs: { property: 'og:url', content: `${base}/` }, injectTo: 'head' },
          {
            tag: 'meta',
            attrs: { property: 'og:image', content: `${base}/og.png` },
            injectTo: 'head',
          },
          { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
          {
            tag: 'meta',
            attrs: { property: 'og:image:alt', content: 'Skymoon GPA' },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'twitter:image', content: `${base}/og.png` },
            injectTo: 'head',
          },
        ]
      },
    },

    // generateBundle is build-only by nature; transformIndexHtml above also
    // runs in dev so the served HTML matches what ships.
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: base
          ? `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
          : `User-agent: *\nAllow: /\n`,
      })

      if (!base) return

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL ?? '').trim()

  if (!siteUrl && mode === 'production') {
    console.warn(
      '\n⚠  VITE_SITE_URL is empty — canonical, Open Graph and sitemap URLs are\n' +
        '   omitted from this build. Set it in .env before you deploy.\n',
    )
  }

  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(siteUrl), serviceWorker()],
  }
})
