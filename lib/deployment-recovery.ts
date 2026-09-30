const DEPLOYMENT_ERROR_PATTERN = /ChunkLoadError|Loading chunk [\w-]+ failed|CSS_CHUNK_LOAD_FAILED|Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically imported module/i

function getErrorText(value: unknown): string {
  if (typeof value === "string") return value
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (value && typeof value === "object") {
    const candidate = value as { name?: unknown; message?: unknown; reason?: unknown }
    return [candidate.name, candidate.message, getErrorText(candidate.reason)]
      .filter((part) => typeof part === "string" && part.length > 0)
      .join(": ")
  }
  return ""
}

export function isRecoverableDeploymentError(value: unknown): boolean {
  return DEPLOYMENT_ERROR_PATTERN.test(getErrorText(value))
}

export function buildDeploymentRecoveryUrl(href: string, timestamp: number): string {
  const url = new URL(href)
  url.searchParams.set("__deploy_retry", String(timestamp))
  return url.toString()
}

export function createDeploymentRecoveryScript(): string {
  return `
(function () {
  var marker = "__deploy_retry";
  var pattern = /${DEPLOYMENT_ERROR_PATTERN.source}/${DEPLOYMENT_ERROR_PATTERN.flags};

  function errorText(value) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return [value.name, value.message, errorText(value.reason)].filter(Boolean).join(": ");
  }

  function recover(value) {
    if (!pattern.test(errorText(value))) return;
    var url = new URL(window.location.href);
    if (url.searchParams.has(marker)) return;
    url.searchParams.set(marker, String(Date.now()));
    window.location.replace(url.toString());
  }

  window.addEventListener("error", function (event) {
    recover(event.error || event.message);
  }, true);
  window.addEventListener("unhandledrejection", function (event) {
    recover(event.reason);
  });
})();`
}
