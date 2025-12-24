/**
 * Sentinel Utilities
 *
 * This file contains security-related utility functions to protect the application
 * from common vulnerabilities. These functions are designed to be simple, robust,
 * and dependency-free.
 */

/**
 * A mapping of characters to their corresponding HTML entities.
 *
 * This map includes characters that are commonly used in Cross-Site Scripting (XSS)
 * attacks. By escaping these characters, we can prevent the browser from interpreting
 * injected markup as executable code.
 *
 * - `&` is replaced to prevent entity confusion.
 * - `<` and `>` are the fundamental HTML tag delimiters.
 * - `"` and `'` are used to break out of attribute values.
 * - `/` can be used in closing tags or paths.
 *
 * @constant
 */
const htmlEscapes: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

/**
 * A regular expression to match the characters that need to be escaped.
 *
 * This regex is constructed from the keys of the `htmlEscapes` map, ensuring that
 * we only target the specific characters that pose a security risk.
 *
 * @constant
 */
const escapeRegex = new RegExp(`[${Object.keys(htmlEscapes).join("")}]`, "g");

/**
 * Sanitizes a string by escaping HTML characters to prevent XSS attacks.
 *
 * This function takes a string as input and replaces any potentially dangerous
 * characters with their corresponding HTML entities. This ensures that when the
 * string is rendered in the browser, it is treated as plain text rather than
 * executable code.
 *
 * @param {string} text The input string to sanitize.
 * @returns {string} The sanitized string with HTML characters escaped.
 */
export const sanitizeHTML = (text: string): string => {
  if (!text) {
    return "";
  }
  return text.replace(escapeRegex, (match) => htmlEscapes[match]);
};
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
