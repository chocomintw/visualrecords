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
};

/**
 * A mapping of HTML entities to their original characters.
 * Used for decoding content that was previously escaped.
 */
const htmlUnescapes: { [key: string]: string } = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&#x27;": "'",
  "&#x2f;": "/",
  "&#47;": "/",
  "&apos;": "'",
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
 * A regular expression to match HTML entities that need to be unescaped.
 */
const unescapeRegex = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi;

/**
 * Sanitizes a string by escaping HTML characters to prevent XSS attacks.
 *
 * This function takes a string as input and replaces any potentially dangerous
 * characters with their corresponding HTML entities. If the input is not a string,
 * it returns an empty string.
 *
 * @param {string | unknown} text The input string to sanitize.
 * @returns {string} The sanitized string with HTML characters escaped.
 */
export const sanitizeHTML = (text: string | unknown): string => {
  if (typeof text !== "string") {
    return "";
  }
  return text.replace(escapeRegex, (match) => htmlEscapes[match]);
};

/**
 * Decodes a string by unescaping common HTML entities.
 *
 * This function takes a string as input and replaces HTML entities
 * with their corresponding characters. Useful for normalizing data.
 *
 * @param {string | unknown} text The input string to decode.
 * @returns {string} The decoded string.
 */
export const decodeHTML = (text: string | unknown): string => {
  if (typeof text !== "string") {
    // If not a string, return as is (coerced to string) but avoid turning into ""
    return text ? String(text) : "";
  }
  return text.replace(unescapeRegex, (match) => {
    const lowerMatch = match.toLowerCase();
    return htmlUnescapes[lowerMatch] || match;
  });
};
