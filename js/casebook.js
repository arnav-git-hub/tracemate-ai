// casebook.js — LocalStorage CRUD for saved lessons
// ============================================================

const STORAGE_KEY = 'tracemate_casebook';
const STATS_KEY   = 'tracemate_stats';

// ── Casebook CRUD ─────────────────────────────────────────

export function getCases() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getCase(id) {
  return getCases().find(c => c.id === id) || null;
}

export function saveCase(caseData) {
  const cases = getCases();
  const existing = cases.findIndex(c => c.id === caseData.id);
  const entry = {
    ...caseData,
    savedAt: new Date().toISOString(),
  };
  if (existing >= 0) {
    cases[existing] = entry;
  } else {
    cases.unshift(entry);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return true;
  } catch {
    return false;
  }
}

export function deleteCase(id) {
  const cases = getCases().filter(c => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return true;
  } catch {
    return false;
  }
}

export function searchCases(query, lang) {
  let cases = getCases();
  if (lang && lang !== 'all') {
    cases = cases.filter(c => c.language === lang);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    cases = cases.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.concept || '').toLowerCase().includes(q) ||
      (c.rootCause || '').toLowerCase().includes(q)
    );
  }
  return cases;
}

// ── Stats ─────────────────────────────────────────────────

export function getStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function incrementStat(key, amount = 1) {
  const stats = getStats();
  stats[key] = (stats[key] || 0) + amount;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch { /* ignore */ }
  return stats[key];
}

export function getStat(key) {
  return getStats()[key] || 0;
}

// ── Derived helpers ───────────────────────────────────────

export function getLanguages() {
  const langs = [...new Set(getCases().map(c => c.language).filter(Boolean))];
  return langs.sort();
}
