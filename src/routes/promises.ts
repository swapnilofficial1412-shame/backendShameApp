import { Router } from 'express';
import { createPromise, getPublicPromises, getAllPromisesDebugController } from '../controllers/promiseController';
import { createPromiseRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting only to the create endpoint
router.post('/', createPromiseRateLimiter, createPromise);
router.get('/public', getPublicPromises);

// DEBUG: Get all promises (including non-visible) - remove in production
router.get('/debug/all', getAllPromisesDebugController);

export default router;

