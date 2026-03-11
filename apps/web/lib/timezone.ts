/**
 * Timezone utility for Indian Standard Time (IST - UTC+5:30)
 * ⚠️  CRITICAL: All date operations in the app MUST use these functions or 'Asia/Kolkata' timeZone parameter
 * 
 * Rule 1: For displaying dates to users → use formatDateIST() or toLocaleDateString with timeZone: 'Asia/Kolkata'
 * Rule 2: For storing timestamps in DB → use getISOStringIST() or CURRENT_TIMESTAMP (server is IST)
 * Rule 3: For date comparisons → use UTC dates with Date.UTC()
 * Rule 4: NEVER use native new Date() for time-sensitive operations without IST adjustment
 */

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5:30 hours in milliseconds = 19800000 ms

/**
 * Get current date in IST as YYYY-MM-DD format
 */
export function getTodayIST(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET);
  return istTime.toISOString().split('T')[0];
}

/**
 * Get current date and time in IST
 */
export function getNowIST(): Date {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET);
}

/**
 * Convert a date string (YYYY-MM-DD) to IST start of day
 * This ensures the date is stored correctly without timezone shifts
 */
export function convertDateToIST(dateString: string): string {
  // Parse as YYYY-MM-DD and convert to IST start of day
  if (!dateString) return getTodayIST();
  
  // Simply return the YYYY-MM-DD string as-is
  // The database will store it as a DATE type without timezone conversion
  return dateString;
}

/**
 * Format a date object to YYYY-MM-DD in IST
 */
export function formatDateIST(date: Date): string {
  const istTime = new Date(date.getTime() + IST_OFFSET);
  return istTime.toISOString().split('T')[0];
}

/**
 * Get ISO string for a date in IST (for timestamp fields)
 * This is used when storing timestamps that need timezone info
 */
export function getISOStringIST(date?: Date): string {
  const d = date || new Date();
  const istTime = new Date(d.getTime() + IST_OFFSET);
  return istTime.toISOString();
}

/**
 * Parse a YYYY-MM-DD string to Date at start of IST day
 */
export function parseIST(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create UTC date, then adjust for IST
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return new Date(utcDate.getTime() - IST_OFFSET);
}

/**
 * Create current IST timestamp (for API responses and timestamps)
 * This is used when the database doesn't handle IST automatically
 */
export function createISTTimestamp(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET);
  return istTime.toISOString();
}

/**
 * Format any date to IST timezone for display
 */
export function formatDateTimeIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', { 
    ...options, 
    timeZone: 'Asia/Kolkata' 
  });
}
