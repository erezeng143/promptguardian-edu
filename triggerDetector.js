// content/triggerDetector.js
// PromptGuardian EDU – trigger detector v1.1
// ------------------------------------------
// ➊ Fast regex table  ➋ BM25-lite fallback  ➌ returns { id, confidence, method, rawMatch }

////////////////////////////////////////////////////////////
// 1 · Regex rules (ordered: first hit wins)               //
////////////////////////////////////////////////////////////
const TRIGGER_REGEX = [
  [/\b(integrate|antiderivative|∫)\b/i,            "solve_integral"],
  [/\b(derivative|differentiate|d\/dx)\b/i,        "find_derivative"],
  [/\b(limit as|lim\s*_{|lim\s+as)\b/i,            "compute_limit"],
  [/\b(determinant|det\(|determinant of)\b/i,      "find_determinant"],
  [/\b(eigenvalue|characteristic polynomial)\b/i,  "find_eigenvalues"],
  [/\b(solve for|roots? of|solutions? to)\b/i,     "solve_equation"],
  [/\b(probability|chance that|prob of)\b/i,       "compute_probability"],
  [/\b(expected value|expectation|mean of)\b/i,    "expected_value"],
  [/\b(permutation|combination|choose|\bC\()\b/i,  "count_combinatorics"],
  [/\b(prime|gcd|modulo|divisibility)\b/i,         "number_theory_task"],
  [/\b(prove that|show that|demonstrate)\b/i,      "prove_statement"],
  [/\b(simplify|factor|expand)\b/i,                "simplify_expression"],
  [/\b(area|perimeter|volume)\b/i,                 "geometry_metric"],
  [/\b(shortest path|graph)\b/i,                   "graph_theory_task"]
];

////////////////////////////////////////////////////////////
// 2 · BM25-lite synonym map (edge fallback)              //
////////////////////////////////////////////////////////////
const SYN_MAP = {
  solve_integral: [
    ["area under the curve", 2.5],
    ["evaluate the integral", 2.0]
  ],
  compute_limit: [["tends to", 1.8]],
  find_determinant: [["cofactor expansion", 2]],
  compute_probability: [["chance that", 2]],
  solve_equation: [["how many solutions", 2]],
  prove_statement: [["is it true that", 1.5]]
};

function bm25Fallback(lower) {
  let bestId = "unknown", bestScore = 0, bestPhrase = null;
  for (const [id, entries] of Object.entries(SYN_MAP)) {
    let score = 0;
    entries.forEach(([phrase, idf]) => {
      if (lower.includes(phrase)) {
        score += idf;
        if (score > bestScore) {
          bestScore = score;
          bestId = id;
          bestPhrase = phrase;
        }
      }
    });
  }
  return {
    id: bestId,
    confidence: bestScore ? Math.min(bestScore / 3, 1) : 0,
    method: bestScore ? "bm25" : "none",
    rawMatch: bestPhrase
  };
}

////////////////////////////////////////////////////////////
// 3 · Public detector                                    //
////////////////////////////////////////////////////////////
function detectTrigger(txt) {
  const lower = txt.toLowerCase();

  // fast regex pass
  for (const [re, id] of TRIGGER_REGEX) {
    const m = lower.match(re);
    if (m) {
      return {
        id,
        confidence: 1,
        method: "regex",
        rawMatch: m[0]
      };
    }
  }

  // fallback lexical scoring
  return bm25Fallback(lower);
}

// 4 · Global & CommonJS export
if (typeof window !== "undefined") window.detectTrigger = detectTrigger;
if (typeof module !== "undefined" && module.exports) module.exports = { detectTrigger };
