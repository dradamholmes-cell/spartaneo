const JOB_KEY = "activeForgeJob";
let pendingDownloadId = null;

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getJob() {
  return (await chrome.storage.local.get(JOB_KEY))[JOB_KEY] || null;
}

async function setJob(job) {
  if (job) await chrome.storage.local.set({ [JOB_KEY]: job });
  else await chrome.storage.local.remove(JOB_KEY);
}

async function tellSpartaneo(payload) {
  const job = await getJob();
  if (!job?.spartaneoTabId) return;
  try {
    await chrome.tabs.sendMessage(job.spartaneoTabId, { type: "forge:update", payload });
  } catch {
    // The user may have closed the Spartaneo tab. The job can still finish server-side.
  }
}

async function postStatus(status, extra = {}) {
  const job = await getJob();
  if (!job) return { ok: false, error: "NO_ACTIVE_JOB" };

  job.lastStatus = status;
  job.lastStatusAt = Date.now();
  await setJob(job);

  try {
    const response = await fetch(`${job.baseUrl}${job.statusEndpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${job.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, ...extra }),
    });
    const data = await response.json().catch(() => ({}));
    await tellSpartaneo({ ok: response.ok, status, ...data });
    return { ok: response.ok, ...data };
  } catch (error) {
    const message = String(error?.message || error);
    await tellSpartaneo({ ok: false, status, error: message });
    return { ok: false, error: message };
  }
}

async function fetchSource() {
  const job = await getJob();
  if (!job) throw new Error("NO_ACTIVE_JOB");
  const response = await fetch(`${job.baseUrl}${job.sourceEndpoint}`, {
    headers: { Authorization: `Bearer ${job.token}` },
  });
  if (!response.ok) throw new Error(`SOURCE_FETCH_${response.status}`);
  const buffer = new Uint8Array(await response.arrayBuffer());
  return {
    base64: bytesToBase64(buffer),
    contentType: response.headers.get("content-type") || "image/jpeg",
  };
}

async function uploadGlbBytes(base64, providerJobId = null) {
  const job = await getJob();
  if (!job) throw new Error("NO_ACTIVE_JOB");
  const bytes = base64ToBytes(base64);
  const response = await fetch(`${job.baseUrl}${job.outputEndpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${job.token}`,
      "Content-Type": "model/gltf-binary",
      ...(providerJobId ? { "X-Provider-Job-Id": providerJobId } : {}),
    },
    body: bytes,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `OUTPUT_UPLOAD_${response.status}`);
  await tellSpartaneo({ ok: true, status: "ready", ...data });
  await setJob(null);
  pendingDownloadId = null;
  return data;
}

async function uploadGlbUrl(url, providerJobId = null) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`TENCENT_DOWNLOAD_${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return uploadGlbBytes(bytesToBase64(bytes), providerJobId);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === "forge:start") {
      const payload = message.payload || {};
      if (!payload.jobId || !payload.token || !payload.baseUrl || !payload.sourceEndpoint || !payload.statusEndpoint || !payload.outputEndpoint) {
        sendResponse({ ok: false, error: "INVALID_FORGE_BRIDGE_PAYLOAD" });
        return;
      }

      const existing = await getJob();
      if (existing && existing.jobId !== payload.jobId) {
        sendResponse({
          ok: false,
          error: "ACTIVE_FORGE_JOB_EXISTS",
          activeJobId: existing.jobId,
          status: existing.lastStatus || "working",
        });
        return;
      }

      const job = {
        ...payload,
        spartaneoTabId: sender.tab?.id || existing?.spartaneoTabId || null,
        startedAt: existing?.startedAt || Date.now(),
        lastStatus: "pending_login",
        lastStatusAt: Date.now(),
      };
      pendingDownloadId = null;
      await setJob(job);
      await postStatus("pending_login");
      const tab = await chrome.tabs.create({ url: "https://3d.hunyuan.tencent.com/", active: true });
      job.tencentTabId = tab.id;
      await setJob(job);
      sendResponse({ ok: true, status: "pending_login", jobId: job.jobId });
      return;
    }

    if (message?.type === "forge:get-active") {
      sendResponse({ ok: true, job: await getJob() });
      return;
    }

    if (message?.type === "forge:clear-active") {
      const previous = await getJob();
      pendingDownloadId = null;
      await setJob(null);
      sendResponse({ ok: true, clearedJobId: previous?.jobId || null });
      return;
    }

    if (message?.type === "forge:status") {
      sendResponse(await postStatus(message.status, message.extra || {}));
      return;
    }

    if (message?.type === "forge:fetch-source") {
      try {
        sendResponse({ ok: true, ...(await fetchSource()) });
      } catch (error) {
        sendResponse({ ok: false, error: String(error?.message || error) });
      }
      return;
    }

    if (message?.type === "forge:upload-glb-bytes") {
      try {
        sendResponse({ ok: true, ...(await uploadGlbBytes(message.base64, message.providerJobId || null)) });
      } catch (error) {
        const text = String(error?.message || error);
        await postStatus("needs_attention", { errorCode: "GLB_RETURN_FAILED", errorMessage: text });
        sendResponse({ ok: false, error: text });
      }
      return;
    }

    if (message?.type === "forge:upload-glb-url") {
      try {
        sendResponse({ ok: true, ...(await uploadGlbUrl(message.url, message.providerJobId || null)) });
      } catch (error) {
        const text = String(error?.message || error);
        await postStatus("needs_attention", { errorCode: "GLB_RETURN_FAILED", errorMessage: text });
        sendResponse({ ok: false, error: text });
      }
      return;
    }

    if (message?.type === "forge:watch-download") {
      pendingDownloadId = null;
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false, error: "UNKNOWN_MESSAGE" });
  })();
  return true;
});

chrome.downloads.onCreated.addListener(async (item) => {
  const job = await getJob();
  if (!job) return;
  const haystack = `${item.filename || ""} ${item.url || ""} ${item.finalUrl || ""}`.toLowerCase();
  if (!haystack.includes(".glb") && !haystack.includes("gltf")) return;
  pendingDownloadId = item.id;
  await postStatus("downloading");
});

chrome.downloads.onChanged.addListener(async (delta) => {
  if (!pendingDownloadId || delta.id !== pendingDownloadId || delta.state?.current !== "complete") return;
  const id = pendingDownloadId;
  pendingDownloadId = null;
  const [item] = await chrome.downloads.search({ id });
  const url = item?.finalUrl || item?.url;
  if (!url) {
    await postStatus("needs_attention", {
      errorCode: "DOWNLOAD_URL_UNAVAILABLE",
      errorMessage: "Tencent downloaded the GLB, but the helper could not recover its URL. Use the manual GLB import button in Spartaneo.",
    });
    return;
  }
  try {
    await uploadGlbUrl(url);
  } catch (error) {
    await postStatus("needs_attention", {
      errorCode: "DOWNLOAD_IMPORT_FAILED",
      errorMessage: `Tencent downloaded the GLB. Automatic return failed: ${String(error?.message || error)}. Use manual GLB import in Spartaneo.`,
    });
  }
});
