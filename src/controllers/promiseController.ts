import { Request, Response } from 'express';
import { createPromiseReportSchema } from '../validations/promiseValidation';
import { createPromiseReport, getVisiblePromises, getAllPromisesDebug } from '../services/promiseService';

export async function createPromise(req: Request, res: Response) {
  try {
    // Validate input
    const validationResult = createPromiseReportSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    // Create promise report
    const promiseReport = await createPromiseReport(validationResult.data);

    return res.status(201).json(promiseReport);
  } catch (error) {
    console.error('Error creating promise report:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create promise report',
    });
  }
}

export async function getPublicPromises(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        error: 'Invalid page number',
        message: 'Page must be greater than 0',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 100',
      });
    }

    const result = await getVisiblePromises(page, limit);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching visible promises:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch visible promises',
    });
  }
}

/**
 * DEBUG: Get all promises (including non-visible) - for troubleshooting
 * This endpoint should be removed or secured in production
 */
export async function getAllPromisesDebugController(req: Request, res: Response) {
  try {
    const result = await getAllPromisesDebug();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching all promises (debug):', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch all promises',
    });
  }
}

