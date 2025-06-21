import { exportLogs } from "../content/logger.js";

document.getElementById("export").addEventListener("click", async () => {
  const logs = await exportLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url,
    filename: `pg_logs_${Date.now()}.json`,
    saveAs: true
  });
  document.getElementById("status").innerText = "Logs exported!";
});
