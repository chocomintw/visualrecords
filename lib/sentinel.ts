// 🛡️ Sentinel: centralized sanitization utility
// This utility is crucial for preventing XSS attacks by ensuring that any potentially malicious user-provided content is cleaned before being rendered in the application.

/**
 * Sanitizes a string to prevent XSS attacks.
 * It replaces special characters with their corresponding HTML entities.
 *
 * @param str The input string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeHTML(str: string | unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
