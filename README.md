# TraceMate AI — The Debugging Detective

> "Don't just fix the bug. Crack the case."

A hackathon project for the **AI for Learning & Developer Productivity** challenge.

---

## 🚀 How to Run

**No installation required.**

1. Open the `tracemate/` folder.
2. Double-click `index.html` — or serve it with any static file server:

```bash
# Python
python -m http.server 3000 --directory tracemate

# Node (npx)
npx serve tracemate

# VS Code
# Use the Live Server extension, right-click index.html → Open with Live Server
```

3. The app loads immediately in your browser. No API keys, no accounts, no build step.

> **Note:** ES modules require either a web server or a browser that supports `file://` module loading. Chrome/Edge work best served via localhost. Firefox may work from file:// directly.

---

## 🔍 The Experience

TraceMate AI walks you through an interactive debugging investigation in six stages:

| Stage | What happens |
|---|---|
| **Case Board** | Browse three demo cases, see your progress stats |
| **Predict** | Read the code, predict the outcome before the reveal |
| **Investigate** | View the full root cause report with evidence and line numbers |
| **Fix Lab** | Side-by-side diff with highlighted changes explained |
| **Proof Panel** | Real JS verification — FAIL before fix, PASS after |
| **Learn** | Concept, analogy, rule of thumb, quiz, practice challenge |
| **Casebook** | Save, search, and revisit completed lessons |

---

## 📂 Three Demo Cases

| # | Title | Language | Category | Difficulty |
|---|---|---|---|---|
| 001 | The Missing Item | Python | Off-by-one Error | Easy |
| 002 | The Vanishing Result | JavaScript | Async / Await | Medium |
| 003 | The Null Trap | Java | Null Pointer Exception | Hard |

All cases are fully self-consistent: snippet → diagnosis → fix → tests → lesson all agree.

---

## 📊 Progress Tracking

All stats are stored in `localStorage` — no account required:
- Cases investigated
- Predictions attempted / correct
- Quiz answers correct
- Lessons saved

---

## 🔌 Optional AI Integration

The "Investigate Your Own Code" form is present but disabled in Demo Mode. To enable live AI analysis:

1. Create a backend endpoint at `/api/analyze` that accepts `{ code, language, expected, actual, level }` and returns a structured diagnosis.
2. In `js/app.js`, find the custom form submit handler and replace the demo stub with a `fetch('/api/analyze', ...)` call.
3. Never put API keys in frontend code.

---

## 📁 File Structure

```
tracemate/
  index.html          ← Entry point (open this)
  css/
    main.css          ← Design tokens, layout, typography
    components.css    ← All UI components
    animations.css    ← Keyframes and transitions
  js/
    app.js            ← Application state machine (all stages)
    cases.js          ← Demo case data (3 complete cases)
    casebook.js       ← LocalStorage CRUD for saved lessons
    quiz.js           ← Quiz engine
    verify.js         ← Deterministic JS verification logic
    ui.js             ← DOM helpers, code block renderer
```

---

## ✅ Definition of Done Checklist

- [x] Judge opens `index.html` with zero setup
- [x] Select a sample case from Case Board
- [x] Complete Predict the Bug (4 options, reveal, score)
- [x] View accurate diagnosis with evidence and line numbers
- [x] Compare broken vs corrected code (diff view)
- [x] View truthful verification (FAIL before, PASS after — real JS)
- [x] Complete 3-question quiz with explanations
- [x] Save lesson and reopen from Casebook
- [x] Responsive layout (mobile + desktop)
- [x] No console errors on happy path
- [x] Progress stats tracked in header
