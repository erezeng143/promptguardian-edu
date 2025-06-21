/* content/templateEngine.js
   PromptGuardian – Template loader + rewriter
   ------------------------------------------ */

let tplCache = null;

/* ---------- loadTemplates ---------------------------------- */
async function loadTemplates() {
  if (tplCache) return tplCache;

  // 1) Remote (synced by SW) -----------------
  const { remoteTemplates } = await chrome.storage.local.get("remoteTemplates");
  if (remoteTemplates) {
    tplCache = remoteTemplates;                 // already JSON from SW
    return tplCache;
  }

  // 2) Bundled file (YAML or JSON) -----------
  const fileURL = chrome.runtime.getURL("templates.yaml");
  const rawTxt  = await fetch(fileURL).then(r => r.text());

  try {
    if (typeof YAML !== "undefined") {
      tplCache = YAML.parse(rawTxt);            // YAML -> JSON
    } else {
      tplCache = JSON.parse(rawTxt);            // if you switched to .json
    }
  } catch (e) {
    console.error("[PG] template parse failed:", e.message);
    tplCache = {};                              // avoid crash
  }
  return tplCache;
}

/* ---------- rewritePrompt ---------------------------------- */
async function rewritePrompt(rawTxt, topic, triggerId) {
  const tpls  = await loadTemplates();
  const block = tpls[topic] || tpls.generic || {};
  const entry = block[triggerId] || block.cot_default || tpls.generic.cot_default;

  if (!entry) {
    // ultimate fall-back: return original prompt unchanged
    return { rewritten: rawTxt, tplId: "none", bypassed: true };
  }

  let rewritten = entry.template.replace("{{PROMPT}}", rawTxt);

  // fidelity: all numbers preserved
  const numsRaw = (rawTxt.match(/\d+/g) || []).join(",");
  const numsNew = (rewritten.match(/\d+/g) || []).join(",");
  const bypass  = numsRaw !== numsNew;

  return {
    rewritten: bypass ? rawTxt : rewritten,
    tplId: entry.id,
    bypassed: bypass
  };
}

/* ---------- export to other scripts ------------------------ */
if (typeof window !== "undefined") window.rewritePrompt = rewritePrompt;
if (typeof module !== "undefined" && module.exports) module.exports = { rewritePrompt };

