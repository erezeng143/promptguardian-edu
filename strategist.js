/* content/strategist.js
   PromptGuardian EDU – Strategist (v2)
   -------------------------------------
   • Alt-R rewrites the last textarea value
   • Uses classifyTopic → detectTrigger → rewritePrompt
   • Logs the event via window.logEvent
   • Shows a quick badge so the user knows something happened
*/

/* ---------- main orchestrator -------------------------------- */
async function runStrategist() {
  const ta = document.querySelector("textarea");
  if (!ta) return;

  const raw = ta.value.trim();
  if (!raw) return;

  /* 1. Topic + trigger */
  const topicTag = window.classifyTopic(raw);         // e.g. "calculus"
  const trigObj  = window.detectTrigger(raw);         // { id, confidence, method, rawMatch }

  /* 2. Template rewrite */
  const { rewritten, tplId, bypassed } =
        await window.rewritePrompt(raw, topicTag, trigObj.id);

  /* 3. Replace textarea only if fidelity passed */
  if (!bypassed) {
    ta.value = rewritten;
    // fire input event so ChatGPT rebinds send button
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /* 4. Log */
  window.logEvent("rewrite", {
    topic: topicTag,
    trigger: trigObj.id,
    tplId,
    bypassed,
    method: trigObj.method,
    conf: trigObj.confidence
  });

  /* 5. Visual feedback */
  flashBadge(bypassed ? "⚠ bypass" : "✏ rewrite");
}

/* ---------- tiny helper: flash badge ------------------------- */
function flashBadge(text) {
  const badge = document.createElement("div");
  badge.textContent = text;
  badge.style = `
    position:fixed; bottom:14px; right:14px; z-index:9999;
    background:#1e88e5; color:#fff; padding:4px 8px;
    font-size:12px; border-radius:4px; 
    box-shadow:0 2px 4px rgba(0,0,0,.25);
  `;
  document.body.appendChild(badge);
  setTimeout(() => badge.remove(), 1500);
}

/* ---------- hot-key binding ---------------------------------- */
document.addEventListener("keydown", e => {
  if (e.altKey && e.key.toLowerCase() === "r") {
    runStrategist();
  }
});

/* ---------- optional message hook (popup button) ------------- */
chrome.runtime.onMessage.addListener((msg, _sender, sendResp) => {
  if (msg === "PG_RUN_STRATEGIST") {
    runStrategist();
    sendResp("done");
  }
});

