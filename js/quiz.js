// quiz.js — Quiz engine
// ============================================================

/**
 * Render a multi-question quiz into `container`.
 * @param {HTMLElement} container
 * @param {Array} questions  - array of { question, options, correctIndex, explanation }
 * @param {Function} onComplete - called with { score, total } when finished
 */
export function renderQuiz(container, questions, onComplete) {
  let currentIndex = 0;
  let score = 0;
  const answers = new Array(questions.length).fill(null);

  function renderQuestion(idx) {
    const q = questions[idx];
    const progress = `Question ${idx + 1} of ${questions.length}`;

    container.innerHTML = `
      <div class="quiz-question anim-scale-in">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--s3);">
          <span class="badge badge-accent">${progress}</span>
          <span style="font-size:0.8rem;color:var(--text-muted);">Score: ${score}/${idx}</span>
        </div>
        <p style="font-size:0.95rem;font-weight:600;margin-bottom:var(--s3);">${escapeHtml(q.question)}</p>
        <div id="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}" aria-label="Option ${String.fromCharCode(65+i)}: ${escapeHtml(opt)}">
              <strong style="color:var(--text-muted);margin-right:var(--s2);">${String.fromCharCode(65+i)}.</strong> ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
        <div class="quiz-explanation" id="quiz-explanation"></div>
      </div>
    `;

    // Bind option clicks
    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(idx, parseInt(btn.dataset.index, 10)));
    });
  }

  function handleAnswer(qIdx, selectedIdx) {
    const q = questions[qIdx];
    const correct = selectedIdx === q.correctIndex;
    if (correct) score++;
    answers[qIdx] = selectedIdx;

    // Style options
    container.querySelectorAll('.quiz-option').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correctIndex) btn.classList.add('correct');
      else if (i === selectedIdx && !correct) btn.classList.add('incorrect');
    });

    // Show explanation
    const expEl = container.querySelector('#quiz-explanation');
    if (expEl) {
      expEl.textContent = q.explanation;
      expEl.classList.add('visible');
    }

    // Next button
    const nextLabel = qIdx + 1 < questions.length ? 'Next Question →' : 'See Results';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    nextBtn.style.marginTop = 'var(--s4)';
    nextBtn.textContent = nextLabel;
    nextBtn.addEventListener('click', () => {
      if (qIdx + 1 < questions.length) {
        currentIndex = qIdx + 1;
        renderQuestion(currentIndex);
      } else {
        renderResults();
      }
    });
    container.querySelector('.quiz-question').appendChild(nextBtn);
  }

  function renderResults() {
    const pct = Math.round((score / questions.length) * 100);
    const msg = pct === 100 ? '🎯 Perfect score!' :
                pct >= 67  ? '✓ Well done!' :
                pct >= 33  ? 'Good try — review the explanations above.' :
                             'Keep learning — that\'s what TraceMate is for!';

    container.innerHTML = `
      <div class="card anim-scale-in" style="text-align:center;padding:var(--s6);">
        <div class="score-circle">
          <span class="score-num">${score}</span>
          <span class="score-denom">of ${questions.length}</span>
        </div>
        <h3 style="margin-bottom:var(--s2);">${msg}</h3>
        <p style="color:var(--text-secondary);font-size:0.9rem;">You answered ${score} out of ${questions.length} questions correctly.</p>
      </div>
    `;

    if (typeof onComplete === 'function') {
      onComplete({ score, total: questions.length, pct });
    }
  }

  // Start
  renderQuestion(0);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
