// background/serviceWorker.js
// =============================================================
// PromptGuardian EDU – Service Worker  v2.1
// Handles: first-run sync, weekly sync, debug pings.
// =============================================================

const PROMPT_URL =
 "https://raw.githubusercontent.com/erezeng143/promhelp/main/prompts.yaml";
const ALARM_NAME = "weeklySync";
const ONE_WEEK_MIN = 60 * 24 * 7;

/* ---------- small helper --------- */
const log = (...args) => console.log("[PG-SW]", ...args);

/* ============ Install / Startup Hooks ============ */

chrome.runtime.onInstalled.addListener(() => {
  log("✅ Installed / updated");
  syncPrompts();     // first pull immediately
  scheduleAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  log("🔄 Browser startup – sync check");
  syncPrompts();
});

/* ============ Alarm for weekly refresh ============ */

function scheduleAlarm() {
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: ONE_WEEK_MIN });
  });
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) {
    log("⏰ Weekly alarm fired – syncing prompts");
    syncPrompts();
  }
});

/* ============ Core sync function ============ */

async function syncPrompts() {
  log("🌀 syncPrompts called");

  /* Guard: skip if placeholder URL still present */
  if (PROMPT_URL.includes("<YOUR-GH-USER>")) {
    log("🔧 PROMPT_URL placeholder detected – skipping remote sync.");
    return;
  }

  try {
    const res = await fetch(PROMPT_URL);
    if (!res.ok) throw new Error(res.status + " " + res.statusText);

    const yamlTxt = await res.text();
    let storedData = yamlTxt;    // default: raw YAML string

    /* Optional parse if YAML lib bundled (esbuild/webpack) */
    if (typeof YAML !== "undefined") {
      try {
        storedData = YAML.parse(yamlTxt);          // JSON object
        log("📑 YAML parsed to JSON –", Object.keys(storedData).length, "entries");
      } catch (e) {
        log("⚠️  YAML parse failed, storing raw text:", e.message);
      }
    }

    await chrome.storage.local.set({
      remotePrompts: storedData,
      fetchedAt: Date.now()
    });

    log("✅ Prompts synced – size:", yamlTxt.length, "bytes");
  } catch (err) {
    log("⚠️  Prompt sync failed:", err.message);
  }
}

/* ============ Debug keep-alive ping ============ */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "PG_PING") {
    log("👋 Ping from", sender.url || "popup");
    sendResponse("pong");
    return true; // keep port open a moment
  }
});

