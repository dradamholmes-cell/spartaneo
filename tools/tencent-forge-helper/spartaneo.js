(() => {
  const READY = "SPARTANEO_FORGE_HELPER_READY";
  const START = "SPARTANEO_FORGE_START";
  const UPDATE = "SPARTANEO_FORGE_UPDATE";

  function announce() {
    window.postMessage({ type: READY, version: "0.1.0" }, window.location.origin);
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || message.type !== START) return;
    chrome.runtime.sendMessage({
      type: "forge:start",
      payload: message.payload,
    }).then((response) => {
      window.postMessage({ type: UPDATE, payload: response || { ok: false, error: "NO_HELPER_RESPONSE" } }, window.location.origin);
    }).catch((error) => {
      window.postMessage({ type: UPDATE, payload: { ok: false, error: String(error?.message || error) } }, window.location.origin);
    });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "forge:update") return;
    window.postMessage({ type: UPDATE, payload: message.payload }, window.location.origin);
  });

  announce();
  setTimeout(announce, 1200);
})();
