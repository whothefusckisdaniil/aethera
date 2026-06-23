/* =====================================================
   ÆTHERA — runtime rebrand + UX polish
   Operates on top of the existing React/Babel app.
   Only DOM-level enhancements; no React internals touched.
   ===================================================== */
(function () {
  'use strict';

  const BRAND_REPLACEMENTS = [
    [/ALANFLIX/g, 'ÆTHERA'],
    [/AlanFlix/g, 'Ætheraa'.replace('aa','a')], // 'Æthera'
    [/alanflix/g, 'æthera'],
  ];

  // Replace text inside a single text node
  function rewriteTextNode(node) {
    let v = node.nodeValue;
    if (!v) return;
    let changed = v;
    for (const [re, to] of BRAND_REPLACEMENTS) changed = changed.replace(re, to);
    if (changed !== v) node.nodeValue = changed;
  }

  // Walk subtree, rewriting text + tagging brand spans for serif styling
  function rewriteSubtree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      rewriteTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;

    // Skip script/style/iframe contents
    const tag = root.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME') return;

    // Tag the nav brand wordmark for serif styling
    if (
      root.tagName === 'SPAN' &&
      /ÆTHERA|ALANFLIX|Æthera|AlanFlix/.test(root.textContent || '') &&
      root.children.length === 0
    ) {
      root.classList.add('ae-brand');
    }

    // Walk children
    const kids = root.childNodes;
    for (let i = 0; i < kids.length; i++) rewriteSubtree(kids[i]);
  }

  // Replace the small Film SVG icon next to the brand with an Æ glyph
  function replaceLogoMark() {
    document.querySelectorAll('nav span.ae-brand').forEach((brandSpan) => {
      const parent = brandSpan.parentElement;
      if (!parent) return;
      // The sibling before the brand is the Film SVG
      const svg = parent.querySelector('svg');
      if (svg && !svg.dataset.aeReplaced) {
        const mark = document.createElement('span');
        mark.className = 'ae-brand-mark';
        mark.textContent = 'Æ';
        svg.replaceWith(mark);
        mark.dataset.aeReplaced = '1';
      }
    });
  }

  // Update document.title after React mounts
  function rewriteTitle() {
    if (/AlanFlix|ALANFLIX/.test(document.title)) {
      document.title = document.title.replace(/AlanFlix|ALANFLIX/g, 'ÆTHERA');
    }
  }

  // Add scrolled-state class to nav for translucent transition
  function setupNavScroll() {
    let nav = document.querySelector('nav.glass-nav');
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('ae-scrolled');
      else nav.classList.remove('ae-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Initial pass + observe future mutations
  function init() {
    rewriteTitle();
    rewriteSubtree(document.body);
    replaceLogoMark();
    setupNavScroll();

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') {
          rewriteTextNode(m.target);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((n) => rewriteSubtree(n));
        }
      }
      replaceLogoMark();
      // re-check for newly mounted nav
      if (!document.querySelector('nav.glass-nav.ae-scrolled') && window.scrollY > 12) {
        const n = document.querySelector('nav.glass-nav');
        if (n) n.classList.add('ae-scrolled');
      }
    });

    obs.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
