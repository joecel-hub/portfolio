// /lab is the shareable Stryg.Bytes link. Link-preview crawlers (WhatsApp,
// Slack, LinkedIn) and the first pass of search indexing read the raw HTML
// without running JS, so the lab's title, description and canonical are
// baked into its copy of index.html here rather than only swapped in the
// browser (src/js/modules/mode-route.js).
import { LAB_TITLE, LAB_DESCRIPTION, pathForMode } from '../src/js/modules/mode-route.js'

const attr = (html, selector, value) =>
  html.replace(new RegExp(`(<meta ${selector} content=")[^"]*(")`), `$1${value}$2`)

const labUrl = (html, pattern) =>
  html.replace(pattern, (_, before, href, after) => before + new URL(pathForMode('lab'), href).href + after)

export function toLabHtml(html) {
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${LAB_TITLE}</title>`)
  out = labUrl(out, /(<link rel="canonical" href=")([^"]*)(")/)
  out = labUrl(out, /(<meta property="og:url" content=")([^"]*)(")/)
  for (const sel of ['property="og:title"', 'name="twitter:title"']) out = attr(out, sel, LAB_TITLE)
  for (const sel of ['name="description"', 'property="og:description"', 'name="twitter:description"']) out = attr(out, sel, LAB_DESCRIPTION)
  // index.html boots Gio via <body class="normal-mode">; the lab must paint as
  // the lab from the first frame, or slow phones see Gio and then a big shift.
  out = out.replace('<body class="normal-mode">', '<body>')
  return out
}
