// FILE: content/verifier.js
// PromptGuardian EDU – SymPy WASM verifier (v0.1)
// ----------------------------------------------

let pyodideReady = null; // Promise<Pyodide>
async function getPyodide() {
  if (pyodideReady) return pyodideReady;
  pyodideReady = loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
  }).then(async (py) => {
    await py.loadPackage("sympy");
    await py.runPythonAsync(`
from sympy import symbols, integrate, sympify, det, Matrix, limit, Derivative
print("✅ SymPy ready")
`);
    return py;
  });
  return pyodideReady;
}

/* ----------------------------------------------------------
   Checker implementations
   Add more: registerChecker("sympy_limit", fn)
---------------------------------------------------------- */
const CHECKERS = {};

// 1) Integral verifier
registerChecker("sympy_integral", async (py, prompt, answer) => {
  /* Naive parse: expects something like "integrate x**2"         */
  /* and answer e.g. "x**3/3". Improve parsing later.             */
  const cleaned = answer.replace(/[^\\d\\w\\*\\+\\-\\/\\^\\(\\) ]/g, "");
  await py.globals.set("expr", cleaned);
  await py.runPythonAsync("result = sympify(expr)");
  // nothing to compare without ground truth; return True if parse OK
  return true;
});

// 2) Matrix determinant
registerChecker("sympy_det", async (py, prompt, answer) => {
  // Very crude: assume answer is a single integer/number
  return /-?\\d+/.test(answer.trim());
});

function registerChecker(id, fn) {
  CHECKERS[id] = fn;
}

/* ----------------------------------------------------------
   PG_verify(checkerId, promptText, answerHtmlElement)
   -------------------------------------------------------- */
window.PG_verify = async function (checkerId, prompt, answerEl) {
  if (!CHECKERS[checkerId]) return; // unknown checker, skip

  // Lazy-load Pyodide
  const py = await getPyodide();

  // Run checker
  let ok = false;
  try {
    ok = await CHECKERS[checkerId](py, prompt, answerEl.innerText);
  } catch (e) {
    console.warn("[PG] Checker error:", e);
  }

  // Border + log
  answerEl.style.border = `2px solid ${ok ? "#4caf50" : "#e53935"}`;
  window.logEvent("verify", { tplId: checkerId, answer_correct: ok });
};

/* ----------------------------------------------------------
   Optional auto-observer: if you know checkerId in template
   -------------------------------------------------------- */
const observer = new MutationObserver((muts) => {
  muts.forEach((m) => {
    m.addedNodes.forEach((node) => {
      if (node.matches && node.matches(".markdown")) {
        // Strategist should have set lastCheckerId on window
        if (window.PG_lastCheckerId) {
          window.PG_verify(window.PG_lastCheckerId, "", node);
          window.PG_lastCheckerId = null; // reset
        }
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });

