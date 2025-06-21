/* Stub verifier: marks answer correct if it ends with a number. */
import { logEvent } from "./logger.js";

function verifyAnswer(answerHtml) {
  const text = answerHtml.innerText || "";
  const ok = /\d$/.test(text.trim());
  answerHtml.style.border = ok ? "2px solid #4caf50" : "2px solid #e53935";
  logEvent("verify", { answer_correct: ok });
}

/* Observe ChatGPT replies */
const observer = new MutationObserver(muts => {
  muts.forEach(m => {
    m.addedNodes.forEach(node => {
      if (node.matches && node.matches(".markdown")) verifyAnswer(node);
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });
