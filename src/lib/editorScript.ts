/**
 * This script is injected into the iframe when HTML is loaded into the editor.
 * It enables click-to-select, hover highlights, inline text editing,
 * and two-way postMessage communication with the parent editor UI.
 */
export const EDITOR_SCRIPT = `(function () {
  'use strict';

  var sel = null;
  var SEL_OUTLINE  = '2px solid #6366f1';
  var EDIT_OUTLINE = '2px solid #10b981';
  var HOVER_OUTLINE = '1px dashed rgba(99,102,241,0.55)';

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toHex(rgb) {
    if (!rgb || rgb === 'transparent') return 'transparent';
    var rgba = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!rgba) return rgb;
    if (rgba[4] !== undefined && parseFloat(rgba[4]) === 0) return 'transparent';
    return '#' + [rgba[1], rgba[2], rgba[3]].map(function (n) {
      return parseInt(n).toString(16).padStart(2, '0');
    }).join('');
  }

  function pxVal(v) {
    if (!v) return '';
    var n = parseFloat(v);
    return isNaN(n) ? '' : String(n);
  }

  function getStyles(el) {
    var s  = el.style;
    var cs = window.getComputedStyle(el);
    return {
      color:          toHex(s.color || cs.color),
      backgroundColor: toHex(s.backgroundColor || cs.backgroundColor),
      fontSize:       pxVal(s.fontSize || cs.fontSize),
      fontFamily:     s.fontFamily || cs.fontFamily,
      fontWeight:     s.fontWeight || cs.fontWeight,
      fontStyle:      s.fontStyle  || cs.fontStyle,
      textDecoration: s.textDecoration || cs.textDecoration,
      textAlign:      s.textAlign  || cs.textAlign,
      letterSpacing:  pxVal(s.letterSpacing !== 'normal' ? s.letterSpacing : (cs.letterSpacing !== 'normal' ? cs.letterSpacing : '0')),
      lineHeight:     s.lineHeight || cs.lineHeight,
      borderRadius:   pxVal(s.borderRadius || cs.borderRadius),
      opacity:        s.opacity || cs.opacity,
      padding:        s.padding || '',
      paddingTop:     pxVal(s.paddingTop    || cs.paddingTop),
      paddingRight:   pxVal(s.paddingRight  || cs.paddingRight),
      paddingBottom:  pxVal(s.paddingBottom || cs.paddingBottom),
      paddingLeft:    pxVal(s.paddingLeft   || cs.paddingLeft),
    };
  }

  function isEditorOutline(v) {
    return v && (
      v.includes('6366f1') ||
      v.includes('10b981') ||
      v.includes('rgba(99')
    );
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function deselect() {
    if (!sel) return;
    sel.style.outline      = sel._savedOutline      || '';
    sel.style.outlineOffset = sel._savedOutlineOffset || '';
    sel = null;
  }

  var TEXT_TAGS = new Set(['p','h1','h2','h3','h4','h5','h6','span','a','li',
    'td','th','button','label','strong','em','b','i','small',
    'figcaption','caption','blockquote','dt','dd']);

  var CONTAINER_TAGS = new Set(['div','section','article','header','footer',
    'main','nav','aside','figure','form','ul','ol','table']);

  function selectEl(el) {
    if (!el || el === document.body || el === document.documentElement) return;
    deselect();
    sel = el;
    sel._savedOutline       = isEditorOutline(el.style.outline) ? '' : (el.style.outline || '');
    sel._savedOutlineOffset = el.style.outlineOffset || '';
    el.style.outline       = SEL_OUTLINE;
    el.style.outlineOffset = '2px';

    window.parent.postMessage({
      type:        'ELEMENT_SELECTED',
      tagName:     el.tagName.toLowerCase(),
      id:          el.id || '',
      className:   (typeof el.className === 'string' ? el.className : '') || '',
      textContent: (el.innerText || el.textContent || '').trim(),
      isText:      TEXT_TAGS.has(el.tagName.toLowerCase()),
      isImage:     el.tagName.toLowerCase() === 'img',
      isContainer: CONTAINER_TAGS.has(el.tagName.toLowerCase()),
      src:         el.src  || null,
      href:        el.href || null,
      alt:         el.alt  || null,
      styles:      getStyles(el),
    }, '*');
  }

  // ── Hover ──────────────────────────────────────────────────────────────────

  document.addEventListener('mouseover', function (e) {
    var el = e.target;
    if (el === sel || el === document.body || el === document.documentElement) return;
    if (!el.style.outline || isEditorOutline(el.style.outline)) return;
    el._hoverActive = true;
    el._preHoverOutline = el.style.outline;
    el.style.outline = HOVER_OUTLINE;
    el.style.outlineOffset = '1px';
  }, true);

  document.addEventListener('mouseout', function (e) {
    var el = e.target;
    if (!el._hoverActive) return;
    el._hoverActive = false;
    el.style.outline = el._preHoverOutline || '';
    el.style.outlineOffset = '';
  }, true);

  // ── Click to select ────────────────────────────────────────────────────────

  document.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') e.preventDefault();
    selectEl(e.target);
  }, true);

  // ── Double-click inline text editing ─────────────────────────────────────

  var EDITABLE_TAGS = new Set([...TEXT_TAGS, 'div']);

  document.addEventListener('dblclick', function (e) {
    var el = e.target;
    if (!EDITABLE_TAGS.has(el.tagName.toLowerCase())) return;
    e.preventDefault();
    el.contentEditable = 'true';
    el.style.outline       = EDIT_OUTLINE;
    el.style.outlineOffset = '2px';
    el.focus();
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);
    } catch (_) {}
    window.parent.postMessage({ type: 'EDITING_TEXT' }, '*');
  }, true);

  document.addEventListener('blur', function (e) {
    var el = e.target;
    if (el.contentEditable !== 'true') return;
    el.contentEditable = 'false';
    el.style.outline = SEL_OUTLINE;
    window.parent.postMessage({
      type: 'TEXT_CHANGED',
      text: (el.innerText || el.textContent || '').trim(),
    }, '*');
  }, true);

  // ── Messages from parent ──────────────────────────────────────────────────

  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.type) return;

    if (e.data.type === 'APPLY_STYLE' && sel) {
      var styles = e.data.styles || {};
      Object.keys(styles).forEach(function (k) {
        try { sel.style[k] = styles[k]; } catch (_) {}
      });
    }

    if (e.data.type === 'GET_HTML') {
      // Temporarily strip editor outlines for clean export
      var all = document.querySelectorAll('*');
      var saved = [];
      all.forEach(function (el) {
        if (isEditorOutline(el.style.outline)) {
          saved.push([el, el.style.outline, el.style.outlineOffset]);
          el.style.outline = '';
          el.style.outlineOffset = '';
        }
      });
      var html = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
      // Restore
      saved.forEach(function (item) {
        item[0].style.outline = item[1];
        item[0].style.outlineOffset = item[2];
      });
      window.parent.postMessage({ type: 'HTML_CONTENT', html: html }, '*');
    }

    if (e.data.type === 'DESELECT') {
      deselect();
      window.parent.postMessage({ type: 'DESELECTED' }, '*');
    }

    if (e.data.type === 'DELETE_ELEMENT' && sel) {
      var toRemove = sel;
      deselect();
      toRemove.remove();
      window.parent.postMessage({ type: 'ELEMENT_DELETED' }, '*');
    }

    if (e.data.type === 'DUPLICATE_ELEMENT' && sel) {
      var clone = sel.cloneNode(true);
      sel.after(clone);
      selectEl(clone);
    }
  });

  window.parent.postMessage({ type: 'EDITOR_READY' }, '*');
})();`;

/** Wrap a plain HTML fragment in a full document structure */
export function normalizeHtml(html: string): string {
  const trimmed = html.trim()
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('<!doctype') || lower.startsWith('<html')) {
    return html
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${html}
</body>
</html>`
}

/** Inject the editor script into an HTML document string */
export function injectEditorScript(html: string): string {
  const tag = `<script data-html-editor="1">\n${EDITOR_SCRIPT}\n</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${tag}\n</body>`)
  if (html.includes('</html>')) return html.replace('</html>', `${tag}\n</html>`)
  return html + `\n${tag}`
}
