import { getVisiblePromises } from '../promiseService';
import { getVisibilityFilter } from '../../utils/visibility';
import prisma from '../../lib/prisma';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    promiseReport: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock visibility utility
jest.mock('../../utils/visibility', () => ({
  getVisibilityFilter: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetVisibilityFilter = getVisibilityFilter as jest.MockedFunction<typeof getVisibilityFilter>;

describe('PromiseService - Visibility Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVisiblePromises', () => {
    it('should use visibility filter from utility', async () => {
      const mockFilter = { visibleAt: { lte: new Date() } };
      mockGetVisibilityFilter.mockReturnValue(mockFilter);
      mockPrisma.promiseReport.findMany.mockResolvedValue([]);
      mockPrisma.promiseReport.count.mockResolvedValue(0);

      await getVisiblePromises(1, 20);

      expect(mockGetVisibilityFilter).toHaveBeenCalled();
      expect(mockPrisma.promiseReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: mockFilter,
        })
      );
      expect(mockPrisma.promiseReport.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: mockFilter,
        })
      );
    });

    it('should enforce visibility at database level - cannot bypass', async () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const mockFilter = { visibleAt: { lte: now } };
      mockGetVisibilityFilter.mockReturnValue(mockFilter);
      
      const visiblePromise = {
        id: '1',
        visibleAt: new Date('2024-01-01T10:00:00Z'), // Before now
      };
      const hiddenPromise = {
        id: '2',
        visibleAt: new Date('2024-01-01T13:00:00Z'), // After now
      };

      mockPrisma.promiseReport.findMany.mockResolvedValue([visiblePromise] as any);
      mockPrisma.promiseReport.count.mockResolvedValue(1);

      const result = await getVisiblePromises(1, 20);

      // Only visible promise should be returned
      expect(result.promises).toHaveLength(1);
      expect(result.promises[0].id).toBe('1');
      
      // Verify the filter was applied - hidden promise would not pass filter
      expect(mockPrisma.promiseReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibleAt: expect.objectContaining({
              lte: now,
            }),
          }),
        })
      );
    });

    it('should handle edge case where visibleAt equals current time', async () => {
      const exactTime = new Date('2024-01-01T12:00:00Z');
      const mockFilter = { visibleAt: { lte: exactTime } };
      mockGetVisibilityFilter.mockReturnValue(mockFilter);
      
      const promise = {
        id: '1',
        visibleAt: exactTime,
      };

      mockPrisma.promiseReport.findMany.mockResolvedValue([promise] as any);
      mockPrisma.promiseReport.count.mockResolvedValue(1);

      const result = await getVisiblePromises(1, 20);

      // Promise with visibleAt === current time should be visible
      expect(result.promises).toHaveLength(1);
    });

    it('should not return promises with future visibleAt', async () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const mockFilter = { visibleAt: { lte: now } };
      mockGetVisibilityFilter.mockReturnValue(mockFilter);

      mockPrisma.promiseReport.findMany.mockResolvedValue([]);
      mockPrisma.promiseReport.count.mockResolvedValue(0);

      const result = await getVisiblePromises(1, 20);

      // No promises should be returned if all have future visibleAt
      expect(result.promises).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should maintain visibility enforcement across pagination', async () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const mockFilter = { visibleAt: { lte: now } };
      mockGetVisibilityFilter.mockReturnValue(mockFilter);

      const promises = [
        { id: '1', visibleAt: new Date('2024-01-01T10:00:00Z') },
        { id: '2', visibleAt: new Date('2024-01-01T11:00:00Z') },
      ];

      mockPrisma.promiseReport.findMany.mockResolvedValue(promises as any);
      mockPrisma.promiseReport.count.mockResolvedValue(2);

      const result = await getVisiblePromises(2, 10);

      // Filter should be applied for both findMany and count
      expect(mockPrisma.promiseReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: mockFilter })
      );
      expect(mockPrisma.promiseReport.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: mockFilter })
      );
    });

    it('should use visibleAt as single source of truth - no other flags', async () => {
      const now = new Date();
      const mockFilter = { visibleAt: { lte: now } };
      mockGetVisibilityFilter.mockReturnValue(mockFilter);

      mockPrisma.promiseReport.findMany.mockResolvedValue([]);
      mockPrisma.promiseReport.count.mockResolvedValue(0);

      await getVisiblePromises(1, 20);

      // Verify filter only uses visibleAt - no isVisible flag or other fields
      const findManyCall = mockPrisma.promiseReport.findMany.mock.calls[0][0];
      expect(findManyCall.where).toEqual(mockFilter);
      expect(findManyCall.where).not.toHaveProperty('isVisible');
      expect(Object.keys(findManyCall.where)).toEqual(['visibleAt']);
    });
  });
});

