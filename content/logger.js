// FILE: content/logger.js
// PromptGuardian EDU — ring-buffer event logger
// Stores the last 1 000 events in chrome.storage.local (key: pgLogs)
// ---------------------------------------------------------------

const MAX_LOGS = 1000;

/**
 * Usage examples:
 *   logEvent("rewrite", { topic: "calculus", tplId: "cot_integral_v3" });
 *   logEvent("verify",  { tplId: "cot_integral_v3", answer_correct: true });
 */
function logEvent(type, data = {}) {
  chrome.storage.local.get({ pgLogs: [] }, ({ pgLogs }) => {
    pgLogs.push({ ts: Date.now(), type, ...data });

    // Keep only the last MAX_LOGS entries
    if (pgLogs.length > MAX_LOGS) {
      pgLogs.splice(0, pgLogs.length - MAX_LOGS);
    }
    chrome.storage.local.set({ pgLogs });
  });
}

/* Expose to other content scripts */
if (typeof window !== "undefined") {
  window.logEvent = logEvent;
}

/* Export for Node / Jest unit tests */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { logEvent };
}
