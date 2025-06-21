// FILE: content/strategist.js
// PromptGuardian EDU – Strategist (v2.2)
// --------------------------------------
// • Alt-R rewrites the textarea.
// • Stores last checker so verifier can run automatically.

async function runStrategist() {
  const ta = document.querySelector("textarea");
  if (!ta) return;

  const raw = ta.value.trim();
  if (!raw) return;

  // 1 · Classify + detect trigger
  const topicTag = window.classifyTopic(raw);
  const trigObj  = window.detectTrigger(raw);   // {id, confidence, method, rawMatch}

  // 2 · Rewrite via Template Engine
  const { rewritten, tplId, checker, bypassed } =
        await window.rewritePrompt(raw, topicTag, trigObj.id);

  // 3 · Swap textarea if fidelity passed
  if (!bypassed) {
    ta.value = rewritten;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // 4 · Remember checker for the upcoming GPT reply
  window.PG_lastCheckerId = checker || tplId || null;

  // 5 · Log event
  window.logEvent("rewrite", {
    topic: topicTag,
    trigger: trigObj.id,
    tplId,
    checker,
    bypassed,
    method: trigObj.method,
    conf: trigObj.confidence
  });

  // 6 · Tiny badge
  flashBadge(bypassed ? "⚠ bypass" : "✏ rewrite");
}

/* Badge helper */
function flashBadge(text) {
  const d = document.createElement("div");
  d.textContent = text;
  d.style = `
    position:fixed; bottom:14px; right:14px; z-index:9999;
    background:#1e88e5; color:#fff; padding:4px 8px;
    font-size:12px; border-radius:4px;
    box-shadow:0 2px 4px rgba(0,0,0,.25);
  `;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1500);
}

/* Alt-R hot-key */
document.addEventListener("keydown", e => {
  if (e.altKey && e.key.toLowerCase() === "r") runStrategist();
});

/* Optional message from popup */
chrome.runtime.onMessage.addListener((msg, _s, res) => {
  if (msg === "PG_RUN_STRATEGIST") {
    runStrategist();
    res("done");
  }
});


