// A simple HTML sanitizer to prevent XSS.
export const sanitizeHTML = (text: string): string => {
  if (!text) return ""
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
