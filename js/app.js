// app.js — Main application state machine
// Stages: board → predict → investigate → fix → learn → casebook
// ============================================================

import { CASES, getCaseById }  from './cases.js';
import { runVerification }      from './verify.js';
import { renderQuiz }           from './quiz.js';
import {
  getCases, saveCase, deleteCase, searchCases,
  getLanguages, incrementStat, getStat,
} from './casebook.js';
import {
  qs, qsa, render, codeBlock, badge, showToast,
  stageProgress, diffBadge, langBadge, copyToClipboard,
  initCollapsibles, escapeHtml,
} from './ui.js';

// ── App state ─────────────────────────────────────────────
const state = {
  stage: 'board',
  caseData: null,       // active case object
  level: 'beginner',   // explanation level
  predicted: null,     // option id user chose
  quizScore: null,     // { score, total }
  verification: null,  // result from runVerification
};

const STAGE_LABELS = ['Case Board', 'Predict', 'Investigate', 'Fix Lab', 'Learn', 'Casebook'];
const STAGE_IDS    = ['board',      'predict', 'investigate', 'fix',     'learn', 'casebook'];

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindNav();
  updateStats();
  navigate('board');
});

// ── Navigation ────────────────────────────────────────────
export function navigate(stage, payload) {
  state.stage = stage;

  // Update active nav button
  qsa('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.stage === stage));

  const app = qs('#app');
  app.classList.remove('stage-transition');
  void app.offsetWidth;
  app.classList.add('stage-transition');

  switch (stage) {
    case 'board':       renderBoard(); break;
    case 'predict':     startCase(payload); break;
    case 'investigate': renderInvestigate(); break;
    case 'fix':         renderFix(); break;
    case 'learn':       renderLearn(); break;
    case 'casebook':    renderCasebook(); break;
    default:            renderBoard();
  }
}

function bindNav() {
  qs('#nav-board').addEventListener('click',    () => navigate('board'));
  qs('#nav-casebook').addEventListener('click', () => navigate('casebook'));
  qs('.logo').addEventListener('click',         () => navigate('board'));
}

// ── Stats ──────────────────────────────────────────────────
function updateStats() {
  const setVal = (id, v) => { const el = qs(`#stat-${id}`); if (el) el.textContent = v; };
  setVal('cases',      getStat('cases_investigated'));
  setVal('predictions',getStat('predictions_attempted'));
  setVal('quiz',       getStat('quiz_correct'));
  setVal('saved',      getStat('lessons_saved'));
}

// ── STAGE: Case Board ─────────────────────────────────────
function renderBoard() {
  const recent = getCases().slice(0, 3);

  const caseCards = CASES.map(c => `
    <div class="case-card" tabindex="0" data-id="${c.id}" role="button" aria-label="Investigate ${c.title}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s3);margin-bottom:var(--s3);">
        <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;">CASE ${c.number}</span>
        <div style="display:flex;gap:var(--s2);">${langBadge(c.language)} ${diffBadge(c.difficulty)}</div>
      </div>
      <h3 style="margin-bottom:var(--s1);">${escapeHtml(c.title)}</h3>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:var(--s4);">${escapeHtml(c.tagline)}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span class="badge badge-neutral">${escapeHtml(c.category)}</span>
        <span style="font-size:0.8rem;color:var(--accent);font-weight:600;">Investigate →</span>
      </div>
    </div>
  `).join('');

  const recentHtml = recent.length ? recent.map(c => `
    <div class="saved-case-row" tabindex="0" data-id="${c.id}" role="button">
      <div class="saved-case-info">
        <div class="saved-case-title">${escapeHtml(c.title || 'Untitled')}</div>
        <div class="saved-case-meta">${escapeHtml(c.language || '')} · Saved ${formatDate(c.savedAt)}</div>
      </div>
      ${c.quizScore != null ? `<span class="badge badge-accent">${c.quizScore}/${c.quizTotal}</span>` : ''}
      <span style="color:var(--text-muted);font-size:1rem;">›</span>
    </div>
  `).join('') : `
    <div class="empty-state" style="padding:var(--s6) var(--s4);">
      <div class="empty-state-icon">📂</div>
      <p style="color:var(--text-secondary);font-size:0.875rem;">No saved lessons yet.<br>Complete a case to save it here.</p>
    </div>
  `;

  render('#app', `
    <div class="container">
      <!-- Hero -->
      <div style="text-align:center;padding:var(--s7) var(--s4) var(--s6);max-width:640px;margin:0 auto;" class="anim-slide-up">
        <div class="demo-label" style="margin-bottom:var(--s4);">Demo Mode — 3 curated cases</div>
        <h1 style="margin-bottom:var(--s3);">Don't just fix the bug.<br><span style="color:var(--accent);">Crack the case.</span></h1>
        <p style="color:var(--text-secondary);font-size:1rem;line-height:1.7;margin-bottom:var(--s5);">
          TraceMate AI walks you through the detective process of debugging — predict the behaviour, examine the evidence, understand the root cause, apply the minimal fix, and turn every mistake into a lasting lesson.
        </p>
      </div>

      <!-- Sample Cases -->
      <div style="margin-bottom:var(--s7);" class="anim-stagger">
        <div class="section-heading">
          <h2>🔍 Open a Case</h2>
          <p>Select a sample case to begin the investigation workflow.</p>
        </div>
        <div class="case-grid" id="case-grid">
          ${caseCards}
        </div>
      </div>

      <!-- Custom Input -->
      <div class="card" style="margin-bottom:var(--s7);" id="custom-form-card">
        <div class="card-header">
          <span class="card-title">🛠 Investigate Your Own Code</span>
          <span class="demo-label">AI feature — coming soon</span>
        </div>
        <form id="custom-form">
          <div class="form-group">
            <label class="form-label" for="code-input">Paste your code</label>
            <textarea class="form-textarea" id="code-input" placeholder="Paste the broken code here..." rows="8" spellcheck="false"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="lang-select">Language</label>
              <select class="form-select" id="lang-select">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="level-select">Explanation level</label>
              <select class="form-select" id="level-select">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="expected-input">Expected behaviour</label>
              <input class="form-input" type="text" id="expected-input" placeholder="What should this code do?">
            </div>
            <div class="form-group">
              <label class="form-label" for="actual-input">Actual behaviour</label>
              <input class="form-input" type="text" id="actual-input" placeholder="What does it do instead?">
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--s3);">
            <button type="submit" class="btn btn-primary btn-lg" disabled title="AI analysis coming soon">
              <span class="spinner"></span> Analyze with AI
            </button>
            <span style="font-size:0.8rem;color:var(--text-muted);">Live AI analysis requires a provider API key (not configured in demo mode).</span>
          </div>
        </form>
      </div>

      <!-- Recent Cases -->
      <div>
        <div class="card-header" style="margin-bottom:var(--s3);">
          <h2>📚 Recent Lessons</h2>
          <button class="btn btn-ghost btn-sm" id="view-all-btn">View all →</button>
        </div>
        <div id="recent-list" class="anim-stagger">${recentHtml}</div>
      </div>
    </div>
  `);

  // Bind case cards
  qsa('.case-card').forEach(card => {
    const handler = () => navigate('predict', card.dataset.id);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
  });

  // Bind recent case rows
  qsa('#recent-list .saved-case-row').forEach(row => {
    const handler = () => openSavedCase(row.dataset.id);
    row.addEventListener('click', handler);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
  });

  qs('#view-all-btn')?.addEventListener('click', () => navigate('casebook'));
}

// ── STAGE: Start a case (predict entry point) ─────────────
function startCase(caseIdOrData) {
  if (typeof caseIdOrData === 'string') {
    state.caseData = getCaseById(caseIdOrData);
  } else {
    state.caseData = caseIdOrData;
  }
  if (!state.caseData) { navigate('board'); return; }

  state.predicted = null;
  state.quizScore = null;
  state.verification = null;
  state.level = 'beginner';

  incrementStat('cases_investigated');
  updateStats();

  renderPredict();
}

// ── STAGE: Predict the Bug ────────────────────────────────
function renderPredict() {
  const c = state.caseData;
  if (!c) return;

  const progress = stageProgress(['Predict', 'Investigate', 'Fix Lab', 'Learn'], 0);

  render('#app', `
    <div class="container">
      ${progress}
      <div style="max-width:700px;margin:0 auto;">
        <!-- Case file header -->
        <div style="display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s5);">
          <div style="background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--r2);padding:var(--s2) var(--s4);font-size:0.75rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;">
            CASE ${escapeHtml(c.number)}
          </div>
          ${langBadge(c.language)}
          ${diffBadge(c.difficulty)}
          <span class="badge badge-neutral">${escapeHtml(c.category)}</span>
        </div>

        <h2 style="margin-bottom:var(--s1);">🔎 ${escapeHtml(c.title)}</h2>
        <p style="color:var(--text-secondary);margin-bottom:var(--s5);">${escapeHtml(c.tagline)}</p>

        <!-- Case file card -->
        <div class="card" style="margin-bottom:var(--s5);">
          <div class="card-header">
            <span class="card-title">📄 Case File — Examine the Evidence</span>
            <span class="demo-label">Demo</span>
          </div>
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--s3);">Study this code carefully before making your prediction.</p>
          ${codeBlock(c.snippet)}
        </div>

        <!-- Prediction prompt -->
        <div class="card" id="predict-card">
          <h3 style="margin-bottom:var(--s4);">🤔 ${escapeHtml(c.predict.question)}</h3>
          <div class="option-grid" id="options-grid">
            ${c.predict.options.map(opt => `
              <button class="option-btn" data-id="${opt.id}" aria-label="${escapeHtml(opt.text)}">
                <strong style="color:var(--accent);margin-right:var(--s2);">${opt.id.toUpperCase()}.</strong>
                ${escapeHtml(opt.text)}
              </button>
            `).join('')}
          </div>
          <div style="margin-top:var(--s4);text-align:right;">
            <button class="btn btn-ghost btn-sm" id="skip-btn">Skip — go straight to diagnosis</button>
          </div>
        </div>

        <!-- Reveal panel (hidden until answer) -->
        <div id="reveal-panel" style="display:none;"></div>
      </div>
    </div>
  `);

  // Bind options
  qsa('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => handlePrediction(btn.dataset.id));
  });

  qs('#skip-btn').addEventListener('click', () => {
    incrementStat('predictions_attempted');
    updateStats();
    navigate('investigate');
  });
}

function handlePrediction(chosenId) {
  const c = state.caseData;
  state.predicted = chosenId;

  incrementStat('predictions_attempted');
  const correct = chosenId === c.predict.correctId;
  if (correct) incrementStat('predictions_correct');
  updateStats();

  // Style all options
  qsa('.option-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.id === c.predict.correctId) {
      btn.classList.add('reveal-correct', 'reveal-anim-correct');
    } else if (btn.dataset.id === chosenId && !correct) {
      btn.classList.add('incorrect', 'reveal-anim-incorrect');
    }
  });

  // Build reveal panel
  const icon  = correct ? '✅' : '❌';
  const title = correct ? 'Correct! Well spotted.' : 'Not quite — here\'s what actually happens.';
  const color = correct ? 'var(--success)' : 'var(--error)';

  const revealHtml = `
    <div class="card reveal-block" style="margin-top:var(--s4);border-color:${color};">
      <div style="display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s4);">
        <span style="font-size:1.5rem;">${icon}</span>
        <h3 style="color:${color};">${title}</h3>
      </div>

      <div class="evidence-panel ${correct ? 'success' : 'error'}" style="margin-bottom:var(--s4);">
        <strong>What actually happens:</strong><br>
        ${escapeHtml(c.predict.actualBehavior)}
      </div>

      <div style="margin-bottom:var(--s4);">
        <strong style="font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;">The Evidence</strong>
        <ul style="margin-top:var(--s2);list-style:none;display:flex;flex-direction:column;gap:var(--s2);">
          ${c.diagnosis.evidence.map(ev => `
            <li style="display:flex;gap:var(--s3);align-items:flex-start;font-size:0.875rem;">
              <span class="badge badge-accent" style="flex-shrink:0;margin-top:2px;">L${ev.line}</span>
              <span style="color:var(--text-secondary);">${escapeHtml(ev.description)}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <button class="btn btn-primary" id="go-investigate-btn">
        View Full Investigation Report →
      </button>
    </div>
  `;

  const panel = qs('#reveal-panel');
  panel.innerHTML = revealHtml;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  qs('#go-investigate-btn').addEventListener('click', () => navigate('investigate'));
}

// ── STAGE: Investigation Report ───────────────────────────
function renderInvestigate() {
  const c = state.caseData;
  if (!c) { navigate('board'); return; }

  const confColor = { high: 'var(--success)', medium: 'var(--warning)', low: 'var(--error)' };
  const confBadge = { high: 'success', medium: 'warning', low: 'error' };
  const conf = c.diagnosis.confidence;

  const progress = stageProgress(['Predict', 'Investigate', 'Fix Lab', 'Learn'], 1);

  render('#app', `
    <div class="container">
      ${progress}
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s5);">
        <button class="btn btn-ghost btn-sm" id="back-predict">← Back</button>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:var(--s2);">
            <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;">CASE ${escapeHtml(c.number)}</span>
            ${langBadge(c.language)} ${diffBadge(c.difficulty)}
          </div>
          <h2 style="margin-top:var(--s1);">🔬 Investigation Report</h2>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 320px;gap:var(--s5);align-items:start;" id="investigate-layout">

        <!-- Main column -->
        <div>
          <!-- Summary -->
          <div class="card" style="margin-bottom:var(--s4);">
            <div class="card-header"><span class="card-title">📋 Case Summary</span></div>
            <p style="font-size:0.9rem;line-height:1.7;">${escapeHtml(c.diagnosis.summary)}</p>
          </div>

          <!-- Root Cause -->
          <div class="card" style="margin-bottom:var(--s4);">
            <div class="card-header">
              <span class="card-title">🎯 Root Cause</span>
              ${badge(conf.toUpperCase() + ' CONFIDENCE', confBadge[conf])}
            </div>
            <p style="font-size:0.9rem;line-height:1.7;margin-bottom:var(--s3);">${escapeHtml(c.diagnosis.rootCause)}</p>
            <div class="evidence-panel" style="font-size:0.82rem;color:var(--text-secondary);">
              <strong style="color:var(--text-primary);">Why this confidence level?</strong><br>${escapeHtml(c.diagnosis.confidenceNote)}
            </div>
          </div>

          <!-- Evidence -->
          <div class="card" style="margin-bottom:var(--s4);">
            <div class="card-header"><span class="card-title">🔍 Evidence</span></div>
            ${c.diagnosis.evidence.map(ev => `
              <div style="display:flex;gap:var(--s3);margin-bottom:var(--s3);align-items:flex-start;">
                <span class="badge badge-accent" style="flex-shrink:0;margin-top:2px;">Line ${ev.line}</span>
                <div style="flex:1;">
                  <p style="font-size:0.875rem;color:var(--text-secondary);">${escapeHtml(ev.description)}</p>
                </div>
              </div>
            `).join('')}
            <div style="margin-top:var(--s3);">
              ${codeBlock(c.snippet, {
                highlights: Object.fromEntries(c.diagnosis.evidence.map(ev => [ev.line, 'focus']))
              })}
            </div>
          </div>

          <!-- Step-by-step -->
          <div class="card" style="margin-bottom:var(--s4);">
            <div class="card-header"><span class="card-title">🪜 Step-by-Step Explanation</span></div>
            <ol style="display:flex;flex-direction:column;gap:var(--s3);">
              ${c.diagnosis.steps.map((step, i) => `
                <li style="display:flex;gap:var(--s3);font-size:0.875rem;">
                  <span style="background:var(--accent);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0;margin-top:1px;">${i+1}</span>
                  <span style="color:var(--text-secondary);line-height:1.6;">${escapeHtml(step)}</span>
                </li>
              `).join('')}
            </ol>
          </div>

          ${c.diagnosis.otherCauses?.length ? `
            <div class="card" style="margin-bottom:var(--s4);">
              <div class="collapsible-header" aria-expanded="false">
                <span class="card-title">💭 Other Plausible Causes</span>
                <svg class="collapsible-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="collapsible-body">
                ${c.diagnosis.otherCauses.map(oc => `
                  <div class="evidence-panel warning" style="font-size:0.875rem;margin-bottom:var(--s2);">${escapeHtml(oc)}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Sidebar -->
        <div>
          <!-- Prediction result -->
          ${state.predicted !== null ? `
            <div class="card card-sm" style="margin-bottom:var(--s4);">
              <div class="card-header"><span class="card-title">🧠 Your Prediction</span></div>
              ${state.predicted === c.predict.correctId
                ? `<div class="badge badge-success" style="width:100%;justify-content:center;padding:var(--s2);">✓ Correct</div>`
                : `<div class="badge badge-error"   style="width:100%;justify-content:center;padding:var(--s2);">✗ Incorrect</div>`
              }
            </div>
          ` : ''}

          <!-- Recommended action -->
          <div class="card card-sm" style="margin-bottom:var(--s4);border-color:var(--accent-dim);">
            <div class="card-header"><span class="card-title">⚡ Recommended Action</span></div>
            <p style="font-size:0.85rem;color:var(--text-secondary);">${escapeHtml(c.diagnosis.nextAction)}</p>
          </div>

          <!-- Quick info -->
          <div class="card card-sm" style="margin-bottom:var(--s4);">
            <div class="card-header"><span class="card-title">📊 Case Details</span></div>
            <div style="display:flex;flex-direction:column;gap:var(--s2);font-size:0.82rem;">
              <div style="display:flex;justify-content:space-between;">
                <span style="color:var(--text-muted);">Language</span>
                ${langBadge(c.language)}
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:var(--text-muted);">Difficulty</span>
                ${diffBadge(c.difficulty)}
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:var(--text-muted);">Category</span>
                <span class="badge badge-neutral">${escapeHtml(c.category)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:var(--text-muted);">Confidence</span>
                ${badge(conf.toUpperCase(), confBadge[conf])}
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-full" id="go-fix-btn">
            Open Fix Lab →
          </button>
        </div>
      </div>
    </div>
  `);

  initCollapsibles();

  qs('#back-predict')?.addEventListener('click', () => {
    state.stage === 'predict' ? renderPredict() : renderPredict();
  });
  qs('#go-fix-btn')?.addEventListener('click', () => navigate('fix'));

  // Responsive sidebar
  injectResponsiveSidebar();
}

// ── STAGE: Fix Lab ────────────────────────────────────────
function renderFix() {
  const c = state.caseData;
  if (!c) { navigate('board'); return; }

  // Run real verification
  if (!state.verification) {
    state.verification = runVerification(c.id);
  }
  const ver = state.verification;

  const progress = stageProgress(['Predict', 'Investigate', 'Fix Lab', 'Learn'], 2);

  // Build diff highlights
  const origHighlights  = {};
  const fixHighlights   = {};
  if (c.fix.removedLines) Object.entries(c.fix.removedLines).forEach(([l]) => { origHighlights[Number(l)] = 'remove'; });
  if (c.fix.changedLines) Object.entries(c.fix.changedLines).forEach(([l]) => { fixHighlights[Number(l)]  = 'add'; });

  const verHtml = ver ? `
    <div style="margin-top:var(--s5);">
      <div class="card-header" style="margin-bottom:var(--s3);">
        <span class="card-title">🧪 Proof Panel — Verification Results</span>
        <span class="demo-label">Real JS execution</span>
      </div>
      <div class="verify-row">
        <div class="verify-status ${ver.before.status === 'PASS' ? 'pass' : 'fail'}">
          ${ver.before.status === 'PASS' ? '✓ PASS' : '✗ FAIL'}
        </div>
        <div>
          <div class="verify-desc"><strong>Before fix:</strong> ${escapeHtml(ver.before.testName)}</div>
          <div class="verify-output">${escapeHtml(ver.before.output)}</div>
        </div>
      </div>
      <div class="verify-row">
        <div class="verify-status ${ver.after.status === 'PASS' ? 'pass' : 'fail'}">
          ${ver.after.status === 'PASS' ? '✓ PASS' : '✗ FAIL'}
        </div>
        <div>
          <div class="verify-desc"><strong>After fix:</strong> ${escapeHtml(ver.after.testName)}</div>
          <div class="verify-output">${escapeHtml(ver.after.output)}</div>
        </div>
      </div>
    </div>
  ` : `
    <div class="evidence-panel warning" style="margin-top:var(--s4);">
      <strong>Custom code:</strong> No automatic verification available. Suggested tests are shown below — run them in your local environment.
    </div>
  `;

  render('#app', `
    <div class="container">
      ${progress}
      <div style="display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s5);">
        <button class="btn btn-ghost btn-sm" id="back-investigate">← Back</button>
        <div>
          <div style="display:flex;gap:var(--s2);margin-bottom:var(--s1);">
            <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;">CASE ${escapeHtml(c.number)}</span>
            ${langBadge(c.language)}
          </div>
          <h2>🛠 Fix Lab</h2>
        </div>
      </div>

      <!-- Diff view -->
      <div class="card" style="margin-bottom:var(--s4);">
        <div class="card-header" style="margin-bottom:var(--s4);">
          <span class="card-title">Code Comparison</span>
          <button class="btn btn-secondary btn-sm" id="copy-fix-btn">Copy Fixed Code</button>
        </div>
        <div class="diff-container">
          <div>
            <div class="diff-label">
              <span class="badge badge-error">BEFORE</span> Original (buggy)
            </div>
            ${codeBlock(c.fix.original, { highlights: origHighlights })}
          </div>
          <div>
            <div class="diff-label">
              <span class="badge badge-success">AFTER</span> Corrected
            </div>
            ${codeBlock(c.fix.corrected, { highlights: fixHighlights })}
          </div>
        </div>
      </div>

      <!-- Changes explained -->
      <div class="card" style="margin-bottom:var(--s4);">
        <div class="collapsible-header" aria-expanded="true">
          <span class="card-title">📝 What Changed & Why</span>
          <svg class="collapsible-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="collapsible-body open">
          ${c.fix.changes.map(ch => `
            <div class="evidence-panel success" style="margin-bottom:var(--s3);">
              <strong>${escapeHtml(ch.what)}</strong><br>
              <span style="color:var(--text-secondary);">${escapeHtml(ch.why)}</span>
            </div>
          `).join('')}
          ${c.fix.alternative ? `
            <div style="margin-top:var(--s3);">
              <div class="diff-label" style="margin-bottom:var(--s2);">
                <span class="badge badge-neutral">ALT</span> Alternative approach
              </div>
              ${codeBlock(c.fix.alternative)}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Suggested tests -->
      <div class="card" style="margin-bottom:var(--s4);">
        <div class="collapsible-header" aria-expanded="false">
          <span class="card-title">🧪 Suggested Tests</span>
          <svg class="collapsible-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="collapsible-body">
          ${c.tests.map(t => `
            <div style="margin-bottom:var(--s4);">
              <div style="display:flex;align-items:center;gap:var(--s2);margin-bottom:var(--s2);">
                <strong style="font-size:0.875rem;">${escapeHtml(t.name)}</strong>
                ${badge(t.expectedResult === 'PASS' ? 'Expected: PASS' : 'Expected: FAIL', t.expectedResult === 'PASS' ? 'success' : 'error')}
              </div>
              ${t.note ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:var(--s2);">${escapeHtml(t.note)}</p>` : ''}
              ${codeBlock(t.code)}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Verification -->
      ${verHtml}

      <div style="margin-top:var(--s5);display:flex;gap:var(--s3);">
        <button class="btn btn-primary btn-lg" id="go-learn-btn">Continue to Lesson →</button>
        <button class="btn btn-ghost" id="revert-btn">↺ View Original</button>
      </div>
    </div>
  `);

  initCollapsibles();

  qs('#back-investigate')?.addEventListener('click', () => navigate('investigate'));
  qs('#go-learn-btn')?.addEventListener('click', () => navigate('learn'));
  qs('#copy-fix-btn')?.addEventListener('click', function() { copyToClipboard(c.fix.corrected, this); });

  let showingOriginal = false;
  qs('#revert-btn')?.addEventListener('click', function() {
    showingOriginal = !showingOriginal;
    this.textContent = showingOriginal ? '← Show Fixed Code' : '↺ View Original';
    showToast(showingOriginal ? 'Showing original code' : 'Showing fixed code', 'info');
  });
}

// ── STAGE: Learn ──────────────────────────────────────────
function renderLearn() {
  const c = state.caseData;
  if (!c) { navigate('board'); return; }

  const progress = stageProgress(['Predict', 'Investigate', 'Fix Lab', 'Learn'], 3);
  const lesson   = c.lesson;
  const lv       = state.level;
  const content  = lesson[lv];

  render('#app', `
    <div class="container">
      ${progress}
      <div style="display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s5);">
        <button class="btn btn-ghost btn-sm" id="back-fix">← Back</button>
        <div>
          <div style="display:flex;gap:var(--s2);margin-bottom:var(--s1);">
            <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;">CASE ${escapeHtml(c.number)}</span>
            ${langBadge(c.language)}
          </div>
          <h2>📖 Learn From This Mistake</h2>
        </div>
      </div>

      <!-- Level tabs -->
      <div class="tabs" id="level-tabs" role="tablist">
        ${['beginner','intermediate','advanced'].map(l => `
          <button class="tab-btn ${l === lv ? 'active' : ''}" data-level="${l}" role="tab" aria-selected="${l === lv}">${cap(l)}</button>
        `).join('')}
      </div>

      <!-- Concept card -->
      <div class="card" style="margin-bottom:var(--s4);">
        <div class="card-header">
          <span class="card-title">💡 Concept</span>
          <span class="badge badge-accent">${escapeHtml(lesson.concept)}</span>
        </div>
        <div class="evidence-panel" style="margin-bottom:var(--s3);">
          <strong>🎭 Analogy:</strong> ${escapeHtml(content.analogy)}
        </div>
        <p style="font-size:0.9rem;line-height:1.75;color:var(--text-secondary);" id="concept-explanation">${escapeHtml(content.explanation)}</p>
      </div>

      <!-- Rule of thumb -->
      <div class="card" style="margin-bottom:var(--s4);border-color:var(--accent-dim);background:var(--accent-glow);">
        <div class="card-header"><span class="card-title">📌 Rule of Thumb</span></div>
        <p style="font-size:0.95rem;font-weight:600;line-height:1.6;">${escapeHtml(content.rule)}</p>
      </div>

      <!-- Practice challenge -->
      <div class="card" style="margin-bottom:var(--s5);">
        <div class="collapsible-header" aria-expanded="false">
          <span class="card-title">🏋️ Practice Challenge</span>
          <svg class="collapsible-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="collapsible-body">
          <h4 style="margin-bottom:var(--s2);">${escapeHtml(lesson.practiceChallenge.title)}</h4>
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--s3);">${escapeHtml(lesson.practiceChallenge.description)}</p>
          ${codeBlock(lesson.practiceChallenge.code)}
          <div class="evidence-panel" style="margin-top:var(--s3);font-size:0.82rem;">
            <strong>Hint:</strong> ${escapeHtml(lesson.practiceChallenge.hint)}
          </div>
        </div>
      </div>

      <!-- Quiz -->
      <div class="card" style="margin-bottom:var(--s4);">
        <div class="card-header"><span class="card-title">🧩 Quick Quiz</span></div>
        <div id="quiz-container"></div>
      </div>

      <!-- Save button (shown after quiz or skip) -->
      <div id="save-section" style="display:none;margin-top:var(--s4);">
        <button class="btn btn-success btn-lg btn-full" id="save-btn">💾 Save to Casebook</button>
      </div>
    </div>
  `);

  initCollapsibles();

  qs('#back-fix')?.addEventListener('click', () => navigate('fix'));

  // Level tabs
  qsa('.tab-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.level = btn.dataset.level;
      renderLearn();
    });
  });

  // Quiz
  const quizContainer = qs('#quiz-container');
  renderQuiz(quizContainer, lesson.quiz, ({ score, total }) => {
    state.quizScore = { score, total };
    incrementStat('quiz_correct', score);
    updateStats();
    qs('#save-section').style.display = 'block';
    qs('#save-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Save
  qs('#save-btn')?.addEventListener('click', () => saveCasebook());
}

function saveCasebook() {
  const c = state.caseData;
  if (!c) return;

  const entry = {
    id: c.id + '-' + Date.now(),
    caseId: c.id,
    title: c.title,
    language: c.language,
    difficulty: c.difficulty,
    rootCause: c.diagnosis.rootCause,
    concept: c.lesson.concept,
    quizScore: state.quizScore?.score ?? null,
    quizTotal: state.quizScore?.total ?? null,
  };

  const ok = saveCase(entry);
  if (ok) {
    incrementStat('lessons_saved');
    updateStats();
    showToast(`"${c.title}" saved to your Casebook`, 'success');
    qs('#save-btn').textContent = '✓ Saved';
    qs('#save-btn').disabled = true;
  } else {
    showToast('Could not save — localStorage may be full', 'error');
  }
}

// ── STAGE: Casebook ───────────────────────────────────────
function renderCasebook() {
  state.stage = 'casebook';
  qsa('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.stage === 'casebook'));

  const langs = ['all', ...getLanguages()];

  render('#app', `
    <div class="container">
      <div class="section-heading" style="margin-bottom:var(--s5);">
        <h2>📚 Personal Casebook</h2>
        <p>Your saved lessons, investigations, and quiz results.</p>
      </div>

      <!-- Search + filter -->
      <div style="display:flex;gap:var(--s3);margin-bottom:var(--s5);">
        <input class="form-input" type="search" id="search-input" placeholder="Search lessons…" style="flex:1;">
        <select class="form-select" id="lang-filter" style="width:160px;">
          ${langs.map(l => `<option value="${l}">${l === 'all' ? 'All Languages' : l}</option>`).join('')}
        </select>
      </div>

      <div id="casebook-list"></div>
    </div>
  `);

  renderCasebookList();

  qs('#search-input')?.addEventListener('input', renderCasebookList);
  qs('#lang-filter')?.addEventListener('change', renderCasebookList);
}

function renderCasebookList() {
  const q    = qs('#search-input')?.value || '';
  const lang = qs('#lang-filter')?.value  || 'all';
  const list = searchCases(q, lang);
  const container = qs('#casebook-list');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No saved lessons found</h3>
        <p>Complete a case investigation and save it to see it here.</p>
        <button class="btn btn-primary" style="margin-top:var(--s4);" id="empty-explore-btn">Explore Cases</button>
      </div>
    `;
    qs('#empty-explore-btn')?.addEventListener('click', () => navigate('board'));
    return;
  }

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--s2);">
      ${list.map(c => `
        <div class="saved-case-row" tabindex="0" data-id="${escapeHtml(c.id)}" role="button">
          <div class="saved-case-info">
            <div class="saved-case-title">${escapeHtml(c.title || 'Untitled')}</div>
            <div class="saved-case-meta">
              ${escapeHtml(c.language || '')} · ${escapeHtml(c.concept || '')} · Saved ${formatDate(c.savedAt)}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--s2);flex-shrink:0;">
            ${c.quizScore != null ? `<span class="badge badge-accent">Quiz: ${c.quizScore}/${c.quizTotal}</span>` : ''}
            ${diffBadge(c.difficulty || 'easy')}
            <button class="btn btn-danger btn-sm delete-btn" data-id="${escapeHtml(c.id)}" aria-label="Delete ${escapeHtml(c.title)}">✕</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Open saved case
  qsa('.saved-case-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.classList.contains('delete-btn')) return;
      openSavedCase(row.dataset.id);
    });
    row.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.classList.contains('delete-btn')) {
        e.preventDefault();
        openSavedCase(row.dataset.id);
      }
    });
  });

  // Delete
  qsa('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Delete this saved lesson?')) {
        deleteCase(id);
        showToast('Lesson deleted', 'info');
        renderCasebookList();
      }
    });
  });
}

function openSavedCase(savedId) {
  const saved = getCase(savedId);
  if (!saved) { showToast('Case not found', 'error'); return; }
  // Re-open the original demo case for full replay
  const demo = getCaseById(saved.caseId || saved.id);
  if (demo) {
    startCase(demo.id);
    navigate('investigate');
  } else {
    showToast('Original case data not found', 'error');
  }
}

// ── Helpers ───────────────────────────────────────────────
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso));
  } catch { return ''; }
}

function injectResponsiveSidebar() {
  // On small screens, collapse the sidebar below the main content
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 900px) {
      #investigate-layout { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}
