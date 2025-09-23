/**
 * Utility functions for formatting text content
 */

/**
 * Formats job description text by preserving line breaks and basic formatting
 * @param text - The raw text to format
 * @returns Formatted text with preserved line breaks
 */
export const formatJobDescription = (text: string | null | undefined): string => {
  if (!text) return ''

  // Replace line breaks with <br> tags to preserve formatting
  return text.replace(/\n/g, '<br />')
}

/**
 * Truncates text while preserving word boundaries
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return ''

  if (text.length <= maxLength) return text

  // Find the last space before maxLength to avoid cutting words
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

/**
 * Formats job description with truncation and proper line break handling
 * @param text - The raw text to format
 * @param maxLength - Maximum length before truncation
 * @returns Formatted and truncated text
 */
export const formatAndTruncateJobDescription = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return ''

  const formatted = formatJobDescription(text)
  return truncateText(formatted, maxLength)
}
