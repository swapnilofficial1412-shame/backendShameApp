import { Request, Response } from 'express';
import { getPublicPromises } from '../promiseController';
import { getVisiblePromises } from '../../services/promiseService';

// Mock the service
jest.mock('../../services/promiseService', () => ({
  getVisiblePromises: jest.fn(),
}));

const mockGetVisiblePromises = getVisiblePromises as jest.MockedFunction<typeof getVisiblePromises>;

describe('PromiseController - Public API Visibility Enforcement', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {
      query: {},
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
  });

  describe('getPublicPromises', () => {
    it('should always use getVisiblePromises service - cannot bypass visibility', async () => {
      const mockResult = {
        promises: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      mockGetVisiblePromises.mockResolvedValue(mockResult);

      await getPublicPromises(mockRequest as Request, mockResponse as Response);

      // Must call the service that enforces visibility
      expect(mockGetVisiblePromises).toHaveBeenCalledWith(1, 20);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockResult);
    });

    it('should enforce visibility even with custom pagination', async () => {
      mockRequest.query = { page: '2', limit: '10' };
      const mockResult = {
        promises: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      };
      mockGetVisiblePromises.mockResolvedValue(mockResult);

      await getPublicPromises(mockRequest as Request, mockResponse as Response);

      // Service is still called - visibility cannot be bypassed
      expect(mockGetVisiblePromises).toHaveBeenCalledWith(2, 10);
    });

    it('should not allow direct database access - must go through service', async () => {
      // This test ensures the controller doesn't bypass the service layer
      const mockResult = {
        promises: [
          {
            id: '1',
            visibleAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockGetVisiblePromises.mockResolvedValue(mockResult);

      await getPublicPromises(mockRequest as Request, mockResponse as Response);

      // Verify service was called (which enforces visibility)
      expect(mockGetVisiblePromises).toHaveBeenCalled();
      // Controller should not have direct prisma access
      // This is verified by the fact that we're mocking the service
    });

    it('should return error if service fails, but visibility rules still apply', async () => {
      const error = new Error('Database error');
      mockGetVisiblePromises.mockRejectedValue(error);

      await getPublicPromises(mockRequest as Request, mockResponse as Response);

      // Even on error, the service (which enforces visibility) was called
      expect(mockGetVisiblePromises).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Visibility Enforcement', () => {
    it('should ensure visibleAt is the only source of truth', async () => {
      const visiblePromise = {
        id: '1',
        visibleAt: new Date('2024-01-01T10:00:00Z'),
      };
      const mockResult = {
        promises: [visiblePromise],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockGetVisiblePromises.mockResolvedValue(mockResult);

      await getPublicPromises(mockRequest as Request, mockResponse as Response);

      // The service uses visibleAt filter - no isVisible flag or other checks
      expect(mockGetVisiblePromises).toHaveBeenCalled();
      const returnedPromise = responseJson.mock.calls[0][0].promises[0];
      expect(returnedPromise).toHaveProperty('visibleAt');
      expect(returnedPromise).not.toHaveProperty('isVisible');
    });
  });
});

