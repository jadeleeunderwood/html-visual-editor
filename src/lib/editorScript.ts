/**
 * Injected into the iframe. Enables selection, inline text editing,
 * drag-to-reorder, undo/redo, and two-way postMessage communication.
 */
export const EDITOR_SCRIPT = `(function () {
  'use strict';

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  var undoStack = [];
  var redoStack = [];
  var MAX_HIST  = 40;

  // Rate-limit saves so rapid slider drags don't flood the stack.
  var _lastSaveEl  = null;
  var _lastSaveAt  = 0;
  var SAVE_GAP     = 800; // ms between saves for same element

  function saveHistory(force) {
    var now = Date.now();
    if (!force && _lastSaveEl === sel && now - _lastSaveAt < SAVE_GAP) return;
    _lastSaveEl = sel;
    _lastSaveAt = now;
    undoStack.push(document.body.innerHTML);
    if (undoStack.length > MAX_HIST) undoStack.shift();
    redoStack = [];
    _notifyHistory();
  }

  function _notifyHistory() {
    window.parent.postMessage({
      type: 'HISTORY_UPDATE',
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
    }, '*');
  }

  // ── Selection state ────────────────────────────────────────────────────────
  var sel = null;
  var SEL_OUTLINE   = '2px solid #6366f1';
  var EDIT_OUTLINE  = '2px solid #10b981';
  var HOVER_OUTLINE = '1px dashed rgba(99,102,241,0.55)';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function toHex(rgb) {
    if (!rgb || rgb === 'transparent') return 'transparent';
    var m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return rgb;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return 'transparent';
    return '#' + [m[1], m[2], m[3]].map(function (n) {
      return parseInt(n).toString(16).padStart(2, '0');
    }).join('');
  }

  function pxNum(v) {
    if (!v || v === 'normal') return '';
    var n = parseFloat(v);
    return isNaN(n) ? '' : String(Math.round(n * 10) / 10);
  }

  function getStyles(el) {
    var s  = el.style;
    var cs = window.getComputedStyle(el);
    return {
      color:           toHex(s.color           || cs.color),
      backgroundColor: toHex(s.backgroundColor || cs.backgroundColor),
      fontSize:        pxNum(s.fontSize         || cs.fontSize),
      fontFamily:      s.fontFamily             || cs.fontFamily,
      fontWeight:      s.fontWeight             || cs.fontWeight,
      fontStyle:       s.fontStyle              || cs.fontStyle,
      textDecoration:  s.textDecoration         || cs.textDecoration,
      textAlign:       s.textAlign              || cs.textAlign,
      letterSpacing:   pxNum(s.letterSpacing !== 'normal' ? s.letterSpacing : (cs.letterSpacing !== 'normal' ? cs.letterSpacing : '0')),
      lineHeight:      s.lineHeight             || cs.lineHeight,
      borderRadius:    pxNum(s.borderRadius     || cs.borderRadius),
      opacity:         s.opacity                || cs.opacity,
      padding:         s.padding                || '',
      paddingTop:      pxNum(s.paddingTop       || cs.paddingTop),
      paddingRight:    pxNum(s.paddingRight     || cs.paddingRight),
      paddingBottom:   pxNum(s.paddingBottom    || cs.paddingBottom),
      paddingLeft:     pxNum(s.paddingLeft      || cs.paddingLeft),
      fill:            s.fill                   || cs.fill     || '',
      stroke:          s.stroke                 || cs.stroke   || '',
      width:           s.width                  || '',
      height:          s.height                 || '',
      marginTop:       pxNum(s.marginTop        || cs.marginTop),
      marginRight:     pxNum(s.marginRight      || cs.marginRight),
      marginBottom:    pxNum(s.marginBottom     || cs.marginBottom),
      marginLeft:      pxNum(s.marginLeft       || cs.marginLeft),
      boxShadow:       s.boxShadow              || cs.boxShadow || 'none',
    };
  }

  function isEditorOutline(v) {
    return v && (v.includes('6366f1') || v.includes('10b981') || v.includes('rgba(99'));
  }

  function deselect() {
    if (!sel) return;
    sel.style.outline       = sel._savedOutline      || '';
    sel.style.outlineOffset = sel._savedOutlineOffset || '';
    sel.style.cursor        = sel._savedCursor        || '';
    sel = null;
  }

  // ── Tag sets ───────────────────────────────────────────────────────────────
  var TEXT_TAGS = new Set([
    'p','h1','h2','h3','h4','h5','h6','span','a','li','td','th',
    'button','label','strong','em','b','i','small','figcaption',
    'caption','blockquote','dt','dd',
  ]);
  var EDITABLE_TAGS = new Set([
    'p','h1','h2','h3','h4','h5','h6','span','a','li','td','th',
    'button','label','strong','em','b','i','small','figcaption',
    'caption','blockquote','dt','dd','div',
  ]);
  var CONTAINER_TAGS = new Set([
    'div','section','article','header','footer','main','nav',
    'aside','figure','form','ul','ol','table',
  ]);

  // ── Select element ─────────────────────────────────────────────────────────
  function selectEl(el) {
    if (!el || el === document.body || el === document.documentElement) return;
    deselect();
    sel = el;
    sel._savedOutline       = isEditorOutline(el.style.outline) ? '' : (el.style.outline || '');
    sel._savedOutlineOffset = el.style.outlineOffset || '';
    sel._savedCursor        = el.style.cursor || '';
    el.style.outline        = SEL_OUTLINE;
    el.style.outlineOffset  = '2px';
    el.style.cursor         = 'move';

    window.parent.postMessage({
      type:        'ELEMENT_SELECTED',
      tagName:     el.tagName.toLowerCase(),
      id:          el.id || '',
      className:   (typeof el.className === 'string' ? el.className : '') || '',
      textContent: (el.innerText || el.textContent || '').trim().slice(0, 300),
      isText:      TEXT_TAGS.has(el.tagName.toLowerCase()),
      isImage:     el.tagName.toLowerCase() === 'img',
      isContainer: CONTAINER_TAGS.has(el.tagName.toLowerCase()),
      isSvg:       el instanceof SVGElement,
      src:         el.src  || null,
      href:        el.href || null,
      alt:         el.alt  || null,
      styles:      getStyles(el),
    }, '*');
  }

  // ── Hover effects ──────────────────────────────────────────────────────────
  document.addEventListener('mouseover', function (e) {
    var el = e.target;
    if (el === sel || el === document.body || el === document.documentElement) return;
    if (el.style.outline && !isEditorOutline(el.style.outline)) return;
    if (!el.style.outline) {
      el._hoverActive = true;
      el.style.outline      = HOVER_OUTLINE;
      el.style.outlineOffset = '1px';
    }
  }, true);

  document.addEventListener('mouseout', function (e) {
    var el = e.target;
    if (el === sel || !el._hoverActive) return;
    el._hoverActive = false;
    el.style.outline      = '';
    el.style.outlineOffset = '';
  }, true);

  // ── Click to select ────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    if (isDragging) return;
    if (e.target.tagName === 'A') e.preventDefault();
    selectEl(e.target);
  }, true);

  // ── Double-click inline text edit ─────────────────────────────────────────
  document.addEventListener('dblclick', function (e) {
    if (isDragging) return;
    var el = e.target;
    if (!EDITABLE_TAGS.has(el.tagName.toLowerCase())) return;
    e.preventDefault();
    el.contentEditable    = 'true';
    el.style.outline      = EDIT_OUTLINE;
    el.style.outlineOffset = '2px';
    el.focus();
    try {
      var r = document.createRange();
      r.selectNodeContents(el);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (_) {}
    window.parent.postMessage({ type: 'EDITING_TEXT' }, '*');
  }, true);

  document.addEventListener('blur', function (e) {
    var el = e.target;
    if (el.contentEditable !== 'true') return;
    saveHistory(true);
    el.contentEditable    = 'false';
    el.style.outline      = SEL_OUTLINE;
    el.style.outlineOffset = '2px';
    window.parent.postMessage({
      type: 'TEXT_CHANGED',
      text: (el.innerText || el.textContent || '').trim(),
    }, '*');
  }, true);

  // ── Drag & Drop (reorder elements) ────────────────────────────────────────
  var isDragging      = false;
  var dragEl          = null;
  var dragGhost       = null;
  var dragPlaceholder = null;
  var dragOffX = 0, dragOffY = 0;

  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var downEl = e.target;
    var downX  = e.clientX;
    var downY  = e.clientY;

    function onMove(ev) {
      if (!isDragging) {
        var dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
        if (dist > 7 && sel && (downEl === sel || sel.contains(downEl))) {
          startDrag(sel, ev.clientX, ev.clientY);
        }
        return;
      }

      ev.preventDefault();
      dragGhost.style.left = (ev.clientX - dragOffX) + 'px';
      dragGhost.style.top  = (ev.clientY - dragOffY) + 'px';

      dragGhost.style.visibility = 'hidden';
      var target = document.elementFromPoint(ev.clientX, ev.clientY);
      dragGhost.style.visibility = '';

      if (!target || target === dragEl || target === dragPlaceholder ||
          target === document.body   || target === document.documentElement ||
          dragEl.contains(target)) return;

      var rect = target.getBoundingClientRect();
      try {
        if (ev.clientY < rect.top + rect.height / 2) {
          target.parentNode.insertBefore(dragPlaceholder, target);
        } else {
          target.parentNode.insertBefore(dragPlaceholder, target.nextSibling);
        }
      } catch (_) {}
    }

    function onUp() {
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup',   onUp,   true);
      document.removeEventListener('pointercancel', onUp, true);
      endDrag();
    }

    document.addEventListener('pointermove',   onMove, true);
    document.addEventListener('pointerup',     onUp,   true);
    document.addEventListener('pointercancel', onUp,   true);
  }, true);

  function startDrag(el, x, y) {
    isDragging = true;
    dragEl     = el;

    var rect = el.getBoundingClientRect();
    dragOffX = x - rect.left;
    dragOffY = y - rect.top;

    // Placeholder
    dragPlaceholder = document.createElement('div');
    dragPlaceholder.setAttribute('data-drag-ph', '1');
    dragPlaceholder.style.cssText =
      'height:' + Math.max(rect.height, 24) + 'px;' +
      'background:rgba(99,102,241,0.08);border:2px dashed #6366f1;' +
      'border-radius:6px;box-sizing:border-box;margin:4px 0;';
    el.parentNode && el.parentNode.insertBefore(dragPlaceholder, el.nextSibling);

    // Ghost
    dragGhost = el.cloneNode(true);
    dragGhost.style.cssText +=
      ';position:fixed;left:' + (x - dragOffX) + 'px;top:' + (y - dragOffY) + 'px' +
      ';width:' + rect.width + 'px;opacity:0.8;pointer-events:none' +
      ';z-index:2147483647;box-shadow:0 12px 40px rgba(0,0,0,0.18)' +
      ';transform:rotate(1.5deg) scale(1.02);transition:none;outline:none;';
    document.body.appendChild(dragGhost);

    el.style.opacity      = '0.15';
    el.style.outline      = '';
    el.style.outlineOffset = '';

    window.parent.postMessage({ type: 'DRAGGING_STARTED' }, '*');
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    if (dragGhost) { dragGhost.remove(); dragGhost = null; }

    if (dragEl && dragPlaceholder && dragPlaceholder.parentNode) {
      dragEl.style.opacity = '';
      dragPlaceholder.parentNode.insertBefore(dragEl, dragPlaceholder);
      dragPlaceholder.remove();
      saveHistory(true);
      selectEl(dragEl);
    } else if (dragEl) {
      dragEl.style.opacity = '';
      selectEl(dragEl);
    }

    if (dragPlaceholder && dragPlaceholder.parentNode) dragPlaceholder.remove();
    dragEl          = null;
    dragPlaceholder = null;

    window.parent.postMessage({ type: 'DRAGGING_ENDED' }, '*');
  }


  // ── Messages from parent ──────────────────────────────────────────────────
  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.type) return;
    var d = e.data;

    switch (d.type) {

      case 'APPLY_STYLE':
        if (sel) {
          saveHistory(false);
          Object.keys(d.styles || {}).forEach(function (k) {
            try { sel.style[k] = d.styles[k]; } catch (_) {}
          });
        }
        break;

      case 'GET_HTML': {
        // Strip editor artefacts temporarily
        var scripts = Array.from(document.querySelectorAll('[data-html-editor]'));
        scripts.forEach(function (s) { s.remove(); });

        var all = Array.from(document.querySelectorAll('*'));
        var savedStyles = [];
        all.forEach(function (el) {
          var save = { el: el, outline: el.style.outline, outlineOffset: el.style.outlineOffset, cursor: el.style.cursor };
          if (isEditorOutline(el.style.outline)) { el.style.outline = ''; el.style.outlineOffset = ''; }
          if (el.style.cursor === 'move') el.style.cursor = '';
          savedStyles.push(save);
        });

        var html = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;

        // Restore
        savedStyles.forEach(function (s) {
          s.el.style.outline      = s.outline;
          s.el.style.outlineOffset = s.outlineOffset;
          s.el.style.cursor       = s.cursor;
        });
        scripts.forEach(function (s) { document.body.appendChild(s); });

        window.parent.postMessage({ type: 'HTML_CONTENT', html: html }, '*');
        break;
      }

      case 'UNDO':
        if (undoStack.length > 0) {
          redoStack.push(document.body.innerHTML);
          document.body.innerHTML = undoStack.pop();
          sel = null;
          window.parent.postMessage({ type: 'DESELECTED' }, '*');
          _notifyHistory();
        }
        break;

      case 'REDO':
        if (redoStack.length > 0) {
          undoStack.push(document.body.innerHTML);
          document.body.innerHTML = redoStack.pop();
          sel = null;
          window.parent.postMessage({ type: 'DESELECTED' }, '*');
          _notifyHistory();
        }
        break;

      case 'DESELECT':
        deselect();
        window.parent.postMessage({ type: 'DESELECTED' }, '*');
        break;

      case 'DELETE_ELEMENT':
        if (sel) {
          saveHistory(true);
          var toRemove = sel;
          deselect();
          toRemove.remove();
          window.parent.postMessage({ type: 'ELEMENT_DELETED' }, '*');
        }
        break;

      case 'DUPLICATE_ELEMENT':
        if (sel) {
          saveHistory(true);
          var clone = sel.cloneNode(true);
          sel.after(clone);
          selectEl(clone);
        }
        break;

      case 'INSERT_ELEMENT': {
        saveHistory(true);
        var wrap = document.createElement('div');
        wrap.innerHTML = d.html;
        var newEl = wrap.firstElementChild || wrap.firstChild;
        if (!newEl) break;
        document.body.appendChild(newEl);
        selectEl(newEl);
        newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        break;
      }

      case 'SET_IMG_SRC':
        if (sel && sel.tagName.toLowerCase() === 'img') {
          saveHistory(true);
          sel.src = d.src;
          if (d.alt) sel.alt = d.alt;
        }
        break;

      case 'SET_HREF':
        if (sel && sel.tagName.toLowerCase() === 'a') {
          saveHistory(true);
          sel.href = d.href;
        }
        break;

      case 'SET_PAGE_BG':
        saveHistory(true);
        document.body.style.backgroundColor = d.color;
        break;
    }
  });

  window.parent.postMessage({
    type: 'EDITOR_READY',
    bodyBg: toHex(document.body.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor),
  }, '*');
})();`;

/** Wrap an HTML fragment in a full document */
export function normalizeHtml(html: string): string {
  const t = html.trim()
  if (t.toLowerCase().startsWith('<!doctype') || t.toLowerCase().startsWith('<html')) return html
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>\n<body>\n${html}\n</body>\n</html>`
}

/** Inject the editor script into a full HTML document */
export function injectEditorScript(html: string): string {
  const script = `<script data-html-editor="1">
document.addEventListener('DOMContentLoaded',function(){
${EDITOR_SCRIPT}
});
</script>`

  // This style tag persists in the exported HTML (no data-html-editor attr),
  // so browser Print → Save as PDF preserves full colours on every exported page.
  const printStyle = `<style id="html-editor-print">@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}</style>`

  if (html.includes('</head>')) return html.replace('</head>', `${printStyle}\n${script}\n</head>`)
  if (html.includes('</body>')) return html.replace('</body>', `${printStyle}\n${script}\n</body>`)
  return html + `\n${printStyle}\n${script}`
}
