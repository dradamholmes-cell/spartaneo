const $ = (id) => document.getElementById(id);
const jobEl = $("job");
const statusEl = $("status");
const startedEl = $("started");
const clearEl = $("clear");
const noteEl = $("note");

function prettyStatus(value) {
  return String(value || "idle").replaceAll("_", " ").toUpperCase();
}

function statusClass(value) {
  if (["ready", "connected"].includes(value)) return "ok";
  if (["needs_attention", "daily_limit"].includes(value)) return "bad";
  return "warn";
}

async function refresh() {
  try {
    const result = await chrome.runtime.sendMessage({ type: "forge:get-active" });
    const job = result?.job || null;
    if (!job) {
      jobEl.textContent = "NONE";
      statusEl.textContent = "IDLE";
      statusEl.className = "warn";
      startedEl.textContent = "—";
      clearEl.hidden = true;
      noteEl.textContent = "Start a Character Forge job from Spartaneo. If Tencent asks you to sign in, do it directly on Tencent.";
      return;
    }

    jobEl.textContent = String(job.jobId || "").slice(0, 8).toUpperCase() || "ACTIVE";
    const status = job.lastStatus || "pending_login";
    statusEl.textContent = prettyStatus(status);
    statusEl.className = statusClass(status);
    startedEl.textContent = job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : "—";
    clearEl.hidden = false;

    if (status === "pending_login") noteEl.textContent = "Finish any Tencent email verification directly on Tencent. The helper will continue afterward.";
    else if (status === "daily_limit") noteEl.textContent = "Tencent's daily free generations are used. Clear this job and come back tomorrow.";
    else if (status === "needs_attention") noteEl.textContent = "Tencent changed something or the helper stopped. Check the Tencent tab, or clear the job and retry.";
    else noteEl.textContent = "Keep the Tencent tab open while the helper works. You can close this popup.";
  } catch (error) {
    statusEl.textContent = "ERROR";
    statusEl.className = "bad";
    noteEl.textContent = String(error?.message || error);
  }
}

$("openTencent").addEventListener("click", async () => {
  await chrome.tabs.create({ url: "https://3d.hunyuan.tencent.com/", active: true });
  window.close();
});

$("openSpartaneo").addEventListener("click", async () => {
  await chrome.tabs.create({ url: "https://www.spartaneo.com/", active: true });
  window.close();
});

clearEl.addEventListener("click", async () => {
  const ok = confirm("Clear the helper's local active job? This does not delete the Spartaneo Forge job or character files.");
  if (!ok) return;
  await chrome.runtime.sendMessage({ type: "forge:clear-active" });
  await refresh();
});

refresh();
