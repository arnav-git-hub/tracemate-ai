// ui.js — Shared DOM helpers
// ============================================================

/** Query-select shorthand */
export const qs  = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Create an element with optional attrs, classes, and innerHTML */
export function el(tag, opts = {}) {
  const e = document.createElement(tag);
  if (opts.cls)   e.className = Array.isArray(opts.cls) ? opts.cls.join(' ') : opts.cls;
  if (opts.html)  e.innerHTML = opts.html;
  if (opts.text)  e.textContent = opts.text;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (opts.on)    Object.entries(opts.on).forEach(([k, v]) => e.addEventListener(k, v));
  return e;
}

/** Render HTML string into a container (replaces content) */
export function render(container, html) {
  if (typeof container === 'string') container = qs(container);
  if (!container) return;
  container.innerHTML = html;
  container.classList.remove('stage-transition');
  void container.offsetWidth; // reflow
  container.classList.add('stage-transition');
}

/** Build line-numbered code block HTML */
export function codeBlock(code, opts = {}) {
  const lines = code.split('\n');
  const highlights = opts.highlights || {};  // { lineNum: 'add'|'remove'|'focus' }
  const lineHtml = lines.map((line, i) => {
    const n = i + 1;
    const cls = highlights[n] ? ` highlight-${highlights[n]}` : '';
    const safe = escapeHtml(line) || '&nbsp;';
    return `<div class="code-line${cls}"><span class="code-line-num">${n}</span><span class="code-line-content">${safe}</span></div>`;
  }).join('');
  return `<div class="code-block"><pre>${lineHtml}</pre></div>`;
}

/** Escape HTML special chars */
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Show a toast notification */
export function showToast(message, type = 'info') {
  let container = qs('#toast-container');
  if (!container) {
    container = el('div', { attrs: { id: 'toast-container' } });
    document.body.appendChild(container);
  }
  const toast = el('div', { cls: `toast ${type}`, html: `<span>${message}</span>` });
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

/** Collapsible section toggle */
export function initCollapsibles(ctx = document) {
  qsa('.collapsible-header', ctx).forEach(header => {
    header.addEventListener('click', () => {
      const expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!expanded));
      const body = qs('.collapsible-body', header.parentElement);
      if (body) body.classList.toggle('open', !expanded);
    });
  });
}

/** Build badge HTML */
export function badge(text, variant = 'neutral') {
  return `<span class="badge badge-${variant}">${escapeHtml(text)}</span>`;
}

/** Build stage progress bar HTML */
export function stageProgress(stages, currentIndex) {
  return `<div class="stage-progress" role="list">` +
    stages.map((s, i) => {
      const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : '';
      const circle = i < currentIndex ? '✓' : i + 1;
      return `
        ${i > 0 ? `<div class="stage-connector${i <= currentIndex ? ' done' : ''}"></div>` : ''}
        <div class="stage-step ${state}" role="listitem">
          <div class="stage-step-circle">${circle}</div>
          <span class="stage-step-label">${s}</span>
        </div>`;
    }).join('') +
  `</div>`;
}

/** Difficulty badge helper */
export function diffBadge(difficulty) {
  const map = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  return badge(map[difficulty] || difficulty, difficulty);
}

/** Lang badge helper */
export function langBadge(lang) {
  return `<span class="badge badge-lang">${escapeHtml(lang)}</span>`;
}

/** Copy text to clipboard */
export async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = '✓ Copied';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1800);
    showToast('Copied to clipboard', 'success');
  } catch {
    showToast('Could not copy — please select manually', 'error');
  }
}
