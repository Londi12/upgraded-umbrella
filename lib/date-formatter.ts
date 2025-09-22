/**
 * Utility functions for formatting job posting dates
 */

export interface DateFormatOptions {
  format?: 'relative' | 'absolute';
  fallback?: string;
}

/**
 * Formats a date string into a human-readable format
 * @param dateString - The date string to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatJobDate(dateString: string | undefined | null, options: DateFormatOptions = {}): string {
  const { format = 'relative', fallback = 'Date not available' } = options;

  if (!dateString) {
    return fallback;
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (format === 'absolute') {
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    // Relative format
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Formats date for display in job cards
 * @param dateString - The date string to format
 * @returns Formatted date string suitable for job cards
 */
export function formatJobCardDate(dateString: string | undefined | null): string {
  return formatJobDate(dateString, {
    format: 'relative',
    fallback: 'Date not available'
  });
}

/**
 * Formats date for detailed job views
 * @param dateString - The date string to format
 * @returns Formatted date string suitable for detailed views
 */
export function formatJobDetailDate(dateString: string | undefined | null): string {
  return formatJobDate(dateString, {
    format: 'relative',
    fallback: 'Posting date not available'
  });
}
