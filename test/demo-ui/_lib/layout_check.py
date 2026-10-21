"""
Comprobación de layout responsive (norma: desktop, tablet y táctil; ver docs/ux-ui/patron-cards-compactas-admin.md).

Uso:
    from layout_check import VIEWPORTS, layout_issues
    for width, height in VIEWPORTS:
        page.set_viewport_size({'width': width, 'height': height})
        issues = layout_issues(page)
        check(f'layout {width}px sin solapes ni scroll horizontal', not issues, '; '.join(issues))
"""

# Desktop, tablet apaisada, tablet vertical, móvil
VIEWPORTS = [(1440, 900), (1024, 768), (768, 1024), (390, 844)]

_JS = r"""() => {
  const issues = [];
  const docW = document.documentElement.scrollWidth;
  if (docW > innerWidth + 1) issues.push(`scroll horizontal: página ${docW}px en viewport ${innerWidth}px`);
  // Lo flotante por diseño (avisos Snackbar `fixed`, barras `sticky`) se superpone al hacer scroll: no es un solape de layout
  const floating = e => { for (let n = e; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const cards = [...document.querySelectorAll('main .MuiPaper-root, main .MuiCard-root')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 20 && !floating(e); });
  const label = e => e.dataset.testid || (e.innerText || '').trim().split('\n')[0].slice(0, 30);
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const a = cards[i], b = cards[j];
    if (a.contains(b) || b.contains(a)) continue;
    const r = a.getBoundingClientRect(), s = b.getBoundingClientRect();
    const w = Math.min(r.right, s.right) - Math.max(r.left, s.left), h = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
    if (w > 2 && h > 2) issues.push(`solape «${label(a)}» con «${label(b)}» (${Math.round(w)}x${Math.round(h)}px)`);
  }
  return issues;
}"""


_SETTLE = """() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  .then(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getTiming().iterations !== Infinity)  // spinners/skeletons nunca acaban
    .map(a => a.finished.catch(() => null))))"""


def layout_issues(page):
    """Solapes entre Papers/Cards del `main` y scroll horizontal de página. Lista vacía = OK.
    Saca el ratón de las cards (el hover las desplaza) y espera al reflow y al fin de las transiciones."""
    page.mouse.move(0, 0)
    page.evaluate(_SETTLE)
    return page.evaluate(_JS)
