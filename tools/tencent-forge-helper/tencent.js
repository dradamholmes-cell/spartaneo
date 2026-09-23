(() => {
  if (window.__spartaneoForgeHelperRunning) return;
  window.__spartaneoForgeHelperRunning = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const visible = (el) => {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const norm = (value) => String(value || "").replace(/\s+/g, " ").trim();

  function candidates() {
    return [...document.querySelectorAll("button,[role='button'],a,label,div,span")].filter(visible);
  }

  function findText(pattern) {
    const matches = candidates().filter((el) => pattern.test(norm(el.textContent)));
    matches.sort((a, b) => norm(a.textContent).length - norm(b.textContent).length);
    return matches[0] || null;
  }

  function clickText(pattern) {
    const el = findText(pattern);
    if (!el) return false;
    const clickable = el.closest("button,[role='button'],a,label") || el;
    clickable.click();
    return true;
  }

  function pageHas(pattern) {
    return pattern.test(norm(document.body?.innerText || ""));
  }

  async function send(message) {
    return chrome.runtime.sendMessage(message);
  }

  function badge(text, kind = "working") {
    let el = document.getElementById("spartaneo-forge-helper-badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "spartaneo-forge-helper-badge";
      Object.assign(el.style, {
        position: "fixed", right: "12px", bottom: "12px", zIndex: "2147483647",
        padding: "9px 12px", borderRadius: "7px", font: "700 12px Arial",
        boxShadow: "0 5px 25px rgba(0,0,0,.45)", maxWidth: "320px",
      });
      document.documentElement.appendChild(el);
    }
    el.textContent = `Spartaneo Forge · ${text}`;
    el.style.background = kind === "error" ? "#42151b" : kind === "ready" ? "#123b23" : "#182019";
    el.style.color = kind === "error" ? "#ffadb5" : "#8cffad";
    el.style.border = `1px solid ${kind === "error" ? "#c45a64" : "#55d77b"}`;
  }

  function loginLikely() {
    const emailInput = document.querySelector("input[type='email']");
    const passwordInput = document.querySelector("input[type='password']");
    const loginText = pageHas(/\b(log\s*in|sign\s*in|email verification|verification code)\b|登录|验证码/i);
    const generationText = pageHas(/image\s*to\s*3d|图生3d|single image|generate now/i);
    return Boolean((emailInput || passwordInput || loginText) && !generationText);
  }

  async function waitForTencentLogin() {
    const deadline = Date.now() + 10 * 60 * 1000;
    if (loginLikely()) {
      badge("Tencent login needed — finish Tencent's own verification here");
      await send({ type: "forge:status", status: "pending_login" });
    }
    while (Date.now() < deadline) {
      if (!loginLikely() && pageHas(/image\s*to\s*3d|图生3d|single image|generate now|3d/i)) {
        await send({ type: "forge:status", status: "connected" });
        badge("Tencent connected", "ready");
        return true;
      }
      await sleep(1500);
    }
    await send({
      type: "forge:status", status: "needs_attention",
      extra: { errorCode: "LOGIN_TIMEOUT", errorMessage: "Tencent login was not completed within 10 minutes." },
    });
    badge("Login timed out — restart from Spartaneo", "error");
    return false;
  }

  async function sourceFile() {
    const result = await send({ type: "forge:fetch-source" });
    if (!result?.ok) throw new Error(result?.error || "SOURCE_FETCH_FAILED");
    const binary = atob(result.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const type = result.contentType || "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return new File([bytes], `spartaneo-character.${ext}`, { type });
  }

  async function chooseMode() {
    clickText(/^image\s*to\s*3d$|^图生3d$/i);
    await sleep(500);
    clickText(/^single image$|单图|单张/i);
    await sleep(350);
    clickText(/^v?3\.1$|hy[-\s]?3d[-\s]?3\.1/i);
    await sleep(300);
    clickText(/^50\s*k$|^50,?000$|5万/i);
    await sleep(350);
  }

  async function uploadSource(file) {
    let input = [...document.querySelectorAll("input[type='file']")].find(visible) || document.querySelector("input[type='file']");
    if (!input) {
      clickText(/upload|上传|add image|choose image/i);
      await sleep(700);
      input = document.querySelector("input[type='file']");
    }
    if (!input) throw new Error("TENCENT_FILE_INPUT_NOT_FOUND");
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(1400);
  }

  function alertText() {
    const nodes = document.querySelectorAll("[role='alert'],.toast,.message,.notification,[class*='toast'],[class*='message']");
    return norm([...nodes].filter(visible).map((n) => n.textContent).join(" "));
  }

  function dailyLimitHit() {
    const text = alertText();
    return /daily.{0,30}(limit|quota|generation)|limit.{0,30}(reached|used)|insufficient.{0,20}(gem|credit)|come back tomorrow|今日.*(次数|额度)|次数.*用完|额度.*用完/i.test(text);
  }

  async function waitForDownload() {
    const deadline = Date.now() + 25 * 60 * 1000;
    let nextHeartbeat = 0;
    while (Date.now() < deadline) {
      if (dailyLimitHit()) {
        await send({ type: "forge:status", status: "daily_limit" });
        badge("Daily Tencent free generations used — come back tomorrow", "error");
        return null;
      }
      const elements = [...document.querySelectorAll("a,button,[role='button']")].filter(visible);
      const download = elements.find((el) => /download|下载|export glb|导出/i.test(norm(el.textContent)));
      if (download) return download;
      if (Date.now() > nextHeartbeat) {
        nextHeartbeat = Date.now() + 30000;
        await send({ type: "forge:status", status: "generating" });
        badge("Generating 50K V3.1 model…");
      }
      await sleep(1800);
    }
    await send({
      type: "forge:status", status: "needs_attention",
      extra: { errorCode: "GENERATION_TIMEOUT", errorMessage: "No Tencent download became available within 25 minutes." },
    });
    badge("Generation timed out — check Tencent", "error");
    return null;
  }

  async function returnDownload(element) {
    const anchor = element.closest("a") || (element.tagName === "A" ? element : null);
    const href = anchor?.href || "";
    await send({ type: "forge:status", status: "downloading" });
    badge("Model finished — returning GLB to Spartaneo");

    if (href && /^https?:/i.test(href)) {
      const result = await send({ type: "forge:upload-glb-url", url: href });
      if (!result?.ok) throw new Error(result?.error || "GLB_RETURN_FAILED");
      return;
    }

    if (href && href.startsWith("blob:")) {
      const response = await fetch(href);
      const buffer = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < buffer.length; i += chunk) binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
      const result = await send({ type: "forge:upload-glb-bytes", base64: btoa(binary) });
      if (!result?.ok) throw new Error(result?.error || "GLB_RETURN_FAILED");
      return;
    }

    await send({ type: "forge:watch-download" });
    element.click();
    badge("Tencent download started — helper is watching for the GLB");
  }

  async function run() {
    const active = await send({ type: "forge:get-active" });
    if (!active?.job) return;
    badge("Helper connected");
    if (!(await waitForTencentLogin())) return;

    try {
      await chooseMode();
      await send({ type: "forge:status", status: "uploading" });
      badge("Uploading your Character Forge photo…");
      await uploadSource(await sourceFile());
      await chooseMode();

      const generate = findText(/generate now|立即生成|开始生成|生成/i);
      if (!generate) throw new Error("GENERATE_BUTTON_NOT_FOUND");
      const clickable = generate.closest("button,[role='button'],a") || generate;
      clickable.click();
      await send({ type: "forge:status", status: "generating" });
      badge("Generating V3.1 · Single Image · 50K…");

      const download = await waitForDownload();
      if (!download) return;
      await returnDownload(download);
      badge("GLB returned to Spartaneo", "ready");
    } catch (error) {
      const message = String(error?.message || error);
      await send({
        type: "forge:status", status: "needs_attention",
        extra: { errorCode: "HELPER_AUTOMATION_STOPPED", errorMessage: message },
      });
      badge(`Stopped: ${message}`, "error");
    }
  }

  setTimeout(run, 1200);
})();
