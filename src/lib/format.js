/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "Feb 4, 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date string with time to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted datetime (e.g., "Feb 4, 2026 at 3:45 PM")
 */
export function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Pick the first available date field from a record
 * Tries created_at, then updated_at, then published_at
 * @param {object} record - Data record with potential date fields
 * @returns {string} The selected date string or empty string
 */
export function pickDateField(record) {
  if (!record) return "";
  return record.created_at || record.updated_at || record.published_at || "";
}

/**
 * Trim text to a maximum of 4 words, with ellipsis if truncated
 * @param {string} text - Text to trim
 * @param {number} maxWords - Maximum number of words (default 4)
 * @returns {string} Trimmed text with ellipsis if needed, or original if within limit
 */
export function trimToWords(text, maxWords = 4) {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}
