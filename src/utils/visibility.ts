/**
 * Visibility utility functions
 * visibleAt is the single source of truth for visibility
 */

/**
 * Check if a promise is visible at a given time
 * A promise is visible when the current time is >= visibleAt
 */
export function isVisible(visibleAt: Date, currentTime: Date = new Date()): boolean {
  return currentTime >= visibleAt;
}

/**
 * Get the visibility filter for Prisma queries
 * Returns a filter object that ensures only visible promises are returned
 */
export function getVisibilityFilter(currentTime: Date = new Date()) {
  return {
    visibleAt: {
      lte: currentTime,
    },
  };
}

/**
 * Validate that a promise is visible before returning it
 * Throws an error if the promise is not visible
 */
export function assertVisible(visibleAt: Date, currentTime: Date = new Date()): void {
  if (!isVisible(visibleAt, currentTime)) {
    throw new Error('Promise is not yet visible');
  }
}

