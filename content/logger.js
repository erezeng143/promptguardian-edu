const MAX = 1000;               // or 90-day via timestamp

export async function logEvent(type, payload = {}) {
  const now = Date.now();
  const entry = { ts: now, type, ...payload };
  const { pgLogs = [] } = await chrome.storage.local.get("pgLogs");
  pgLogs.push(entry);

  /* Trim to last MAX records */
  while (pgLogs.length > MAX) pgLogs.shift();
  await chrome.storage.local.set({ pgLogs });
}

/* Export helper for popup */
export async function exportLogs() {
  const { pgLogs } = await chrome.storage.local.get("pgLogs");
  return pgLogs || [];
}
