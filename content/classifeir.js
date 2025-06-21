// =============================================================
// PromptGuardian EDU v2.1 — Extension Skeleton (condensed)
// =============================================================
// One canvas = one repo.  Split into real files when exporting.
// ─────────────────────────────────────────────────────────────
// manifest.json, popup files, logger.js, etc. remain unchanged
// from the previous version.  Only **classifier.js** is fully
// rewritten below.  All other modules are shown as placeholders
// so the canvas is still self‑contained.
// =============================================================

// -------------------------------------------------------------
// content/classifier.js  <--  COMPLETE REWRITE
// -------------------------------------------------------------
/*
PromptGuardian EDU – Topic Classifier
------------------------------------
Lightweight, zero‑API function that maps a raw math prompt to one
of six high‑level tags used downstream by the Trigger Detector and
Template Engine.  Design goals:
  •  <1 ms per call on mid‑range laptop
  •  No external libraries ⁄ bundled MiniLM optional
  •  Usable in both browser (content‑script) and Node tests

Export strategy:
  •  In browser ⇒ attaches to window.classifyTopic
  •  In Node/CommonJS ⇒ module.exports
*/

(function(global) {
  "use strict";

  // --- 1 · Keyword map  (hand‑crafted from deep‑research PDF) -----
  const TOPIC_KEYWORDS = {
    calculus: [
      "integral", "derivative", "limit", "antiderivative", "series", "d/dx",
      "differentiate", "taylor", "fourier"
    ],
    algebra: [
      "matrix", "determinant", "eigenvalue", "eigenvector", "solve for",
      "polynomial", "factor", "gaussian elimination"
    ],
    probability: [
      "probability", "distribution", "expected", "variance", "bayes",
      "binomial", "normal", "markov"
    ],
    discrete: [
      "graph", "combinatorics", "set ", "permutation", "combination",
      "pigeonhole", "hamilton", "coloring"
    ],
    geometry: [
      "triangle", "circle", "angle", "length", "area", "volume", "polygon",
      "coordinate geometry", "conic"
    ],
    number_theory: [
      "prime", "mod", "gcd", "lcm", "divisibility", "congruence",
      "euclidean algorithm", "diophantine"
    ]
  };

  // Build a fast lookup trie (map first word → topic array indices)
  const FIRST_WORD_MAP = Object.create(null);
  for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
    for (const w of words) {
      const first = w.split(" ")[0];
      (FIRST_WORD_MAP[first] ||= []).push([topic, w]);
    }
  }

  // Utility: lower‑case + ascii folding
  const _norm = s => s.toLowerCase();

  // --- 2 · Main classify function --------------------------------
  function classifyTopic(raw) {
    const txt = _norm(raw);

    // quick pass: first‑word index → direct match
    const firstToken = txt.split(/[^a-z0-9]+/)[0];
    const candPairs = FIRST_WORD_MAP[firstToken] || [];
    for (const [topic, kw] of candPairs) {
      if (txt.includes(kw)) return topic;
    }

    // slower pass: scan all keywords in order of topic size
    for (const [topic, arr] of Object.entries(TOPIC_KEYWORDS)) {
      for (const kw of arr) if (txt.includes(kw)) return topic;
    }

    return "generic"; // fallback
  }

  // --- 3 · Expose in browser & Node --------------------------------
  global.classifyTopic = classifyTopic;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { classifyTopic };
  }

})(typeof window !== "undefined" ? window : globalThis);


// =============================================================
// Below are placeholder stubs for other files so the canvas stays
// self‑contained.  They are **unchanged** from previous revision.
// =============================================================

// content/triggerDetector.js (stub)
// content/templateEngine.js (stub)
// content/strategist.js (partial)
// content/verifier.js (dummy)
// ... (rest of skeleton omitted for brevity)


