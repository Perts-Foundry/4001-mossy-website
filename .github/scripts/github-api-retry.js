// Retry helper for transient GitHub API failures (empty responses, network
// resets, 5xx). Does not retry definitive errors like 409 conflict or 422
// validation failure.
//
// Usage in actions/github-script steps (pass `core` for Actions log integration):
//   const { withRetry } = require("./.github/scripts/github-api-retry.js");
//   await withRetry(() => api.call(), { label: "My call", core });

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 405, 409, 422]);

function isTransient(err) {
  if (NON_RETRYABLE_STATUS.has(err.status)) return false;
  if (RETRYABLE_STATUS.has(err.status)) return true;
  const msg = err.message || "";
  return (
    msg.includes("Unexpected end of JSON input") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("socket hang up") ||
    msg.includes("network") ||
    msg.includes("fetch failed")
  );
}

async function withRetry(
  fn,
  { attempts = 3, delayMs = 2000, label = "API call", core } = {},
) {
  const warn = core ? core.warning.bind(core) : console.warn;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const retriable = isTransient(err);
      if (i < attempts && retriable) {
        const wait = delayMs * Math.pow(2, i - 1);
        warn(
          `${label} failed (attempt ${i}/${attempts}): ${err.message}. Retrying in ${wait}ms...`,
        );
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

module.exports = { withRetry, isTransient };
