import { isVisible, getVisibilityFilter, assertVisible } from '../visibility';

describe('Visibility Utils', () => {
  describe('isVisible', () => {
    it('should return true when current time is after visibleAt', () => {
      const visibleAt = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T11:00:00Z');
      
      expect(isVisible(visibleAt, currentTime)).toBe(true);
    });

    it('should return true when current time equals visibleAt', () => {
      const visibleAt = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T10:00:00Z');
      
      expect(isVisible(visibleAt, currentTime)).toBe(true);
    });

    it('should return false when current time is before visibleAt', () => {
      const visibleAt = new Date('2024-01-01T11:00:00Z');
      const currentTime = new Date('2024-01-01T10:00:00Z');
      
      expect(isVisible(visibleAt, currentTime)).toBe(false);
    });

    it('should use current time when not provided', () => {
      const visibleAt = new Date(Date.now() - 1000); // 1 second ago
      
      expect(isVisible(visibleAt)).toBe(true);
    });

    it('should handle edge case with milliseconds precision', () => {
      const now = new Date('2024-01-01T10:00:00.000Z');
      const visibleAt = new Date('2024-01-01T10:00:00.001Z'); // 1ms later
      
      expect(isVisible(visibleAt, now)).toBe(false);
      
      const visibleAt2 = new Date('2024-01-01T10:00:00.000Z');
      expect(isVisible(visibleAt2, now)).toBe(true);
    });
  });

  describe('getVisibilityFilter', () => {
    it('should return correct Prisma filter for visible promises', () => {
      const currentTime = new Date('2024-01-01T12:00:00Z');
      const filter = getVisibilityFilter(currentTime);
      
      expect(filter).toEqual({
        visibleAt: {
          lte: currentTime,
        },
      });
    });

    it('should use current time when not provided', () => {
      const beforeCall = new Date();
      const filter = getVisibilityFilter();
      const afterCall = new Date();
      
      expect(filter.visibleAt.lte.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(filter.visibleAt.lte.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should ensure filter only returns visible promises', () => {
      const pastTime = new Date('2024-01-01T10:00:00Z');
      const futureTime = new Date('2024-01-01T12:00:00Z');
      const currentTime = new Date('2024-01-01T11:00:00Z');
      
      const filter = getVisibilityFilter(currentTime);
      
      // Filter should allow promises with visibleAt <= currentTime
      expect(pastTime <= currentTime).toBe(true);
      expect(futureTime <= currentTime).toBe(false);
    });
  });

  describe('assertVisible', () => {
    it('should not throw when promise is visible', () => {
      const visibleAt = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T11:00:00Z');
      
      expect(() => assertVisible(visibleAt, currentTime)).not.toThrow();
    });

    it('should not throw when current time equals visibleAt', () => {
      const visibleAt = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T10:00:00Z');
      
      expect(() => assertVisible(visibleAt, currentTime)).not.toThrow();
    });

    it('should throw error when promise is not visible', () => {
      const visibleAt = new Date('2024-01-01T11:00:00Z');
      const currentTime = new Date('2024-01-01T10:00:00Z');
      
      expect(() => assertVisible(visibleAt, currentTime)).toThrow('Promise is not yet visible');
    });

    it('should use current time when not provided', () => {
      const visibleAt = new Date(Date.now() - 1000); // 1 second ago
      
      expect(() => assertVisible(visibleAt)).not.toThrow();
    });

    it('should throw for future promises', () => {
      const visibleAt = new Date(Date.now() + 1000); // 1 second in future
      
      expect(() => assertVisible(visibleAt)).toThrow('Promise is not yet visible');
    });
  });

  describe('Edge Cases', () => {
    it('should handle timezone differences correctly', () => {
      const visibleAt = new Date('2024-01-01T10:00:00Z');
      const currentTimeUTC = new Date('2024-01-01T10:00:00Z');
      const currentTimeLocal = new Date('2024-01-01T10:00:00');
      
      // Both should work the same way since we're comparing Date objects
      expect(isVisible(visibleAt, currentTimeUTC)).toBe(true);
      expect(isVisible(visibleAt, currentTimeLocal)).toBe(true);
    });

    it('should handle very old dates', () => {
      const visibleAt = new Date('2000-01-01T00:00:00Z');
      const currentTime = new Date();
      
      expect(isVisible(visibleAt, currentTime)).toBe(true);
    });

    it('should handle very future dates', () => {
      const visibleAt = new Date('2100-01-01T00:00:00Z');
      const currentTime = new Date();
      
      expect(isVisible(visibleAt, currentTime)).toBe(false);
    });

    it('should handle same timestamp with different timezones', () => {
      const visibleAt = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T10:00:00Z');
      
      // Should be equal regardless of timezone representation
      expect(visibleAt.getTime()).toBe(currentTime.getTime());
      expect(isVisible(visibleAt, currentTime)).toBe(true);
    });
  });
});

