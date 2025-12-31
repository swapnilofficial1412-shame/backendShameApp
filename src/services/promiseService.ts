import prisma from '../lib/prisma';
import { CreatePromiseReportInput } from '../validations/promiseValidation';
import { getVisibilityFilter } from '../utils/visibility';

const VISIBILITY_DELAY_HOURS = parseInt(process.env.VISIBILITY_DELAY_HOURS || '24', 10);

export async function createPromiseReport(input: CreatePromiseReportInput) {
  const now = new Date();
  // If delay is 0, set visibleAt to now (or slightly in the past to ensure immediate visibility)
  // Otherwise, add the delay
  const visibleAt = VISIBILITY_DELAY_HOURS === 0 
    ? new Date(now.getTime() - 1000) // 1 second ago to ensure immediate visibility
    : new Date(now.getTime() + VISIBILITY_DELAY_HOURS * 60 * 60 * 1000);

  console.log('[createPromiseReport] Creating promise with:');
  console.log('  - Current time:', now.toISOString());
  console.log('  - VISIBILITY_DELAY_HOURS:', VISIBILITY_DELAY_HOURS);
  console.log('  - visibleAt:', visibleAt.toISOString());
  console.log('  - Will be visible immediately:', VISIBILITY_DELAY_HOURS === 0);
  console.log('  - accusedName:', input.accusedName);

  const promiseReport = await prisma.promiseReport.create({
    data: {
      reporterName: input.reporterName,
      accusedName: input.accusedName,
      description: input.description,
      datePromised: new Date(input.datePromised),
      visibleAt,
    },
  });

  console.log('[createPromiseReport] Promise created successfully:', promiseReport.id);
  console.log('[createPromiseReport] Promise visibleAt:', promiseReport.visibleAt.toISOString());

  return promiseReport;
}

/**
 * Get visible promises with pagination
 * Uses visibleAt as the single source of truth - only returns promises where visibleAt <= now
 * This function cannot be bypassed - visibility is enforced at the database query level
 */
export async function getVisiblePromises(page: number = 1, limit: number = 20) {
  const now = new Date();
  const skip = (page - 1) * limit;
  
  // Use centralized visibility filter - visibleAt is the single source of truth
  const visibilityFilter = getVisibilityFilter(now);

  // Debug logging
  console.log('[getVisiblePromises] Current time:', now.toISOString());
  console.log('[getVisiblePromises] Visibility filter:', JSON.stringify(visibilityFilter));
  console.log('[getVisiblePromises] VISIBILITY_DELAY_HOURS:', VISIBILITY_DELAY_HOURS);

  const [promises, total] = await Promise.all([
    prisma.promiseReport.findMany({
      where: visibilityFilter,
      orderBy: {
        visibleAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.promiseReport.count({
      where: visibilityFilter,
    }),
  ]);

  // Debug logging
  console.log('[getVisiblePromises] Found', promises.length, 'visible promises out of', total, 'total');
  console.log('[getVisiblePromises] Page:', page, 'Limit:', limit, 'Skip:', skip);
  
  // Check total count in database for comparison
  const totalInDb = await prisma.promiseReport.count();
  console.log('[getVisiblePromises] Total promises in database:', totalInDb);
  console.log('[getVisiblePromises] Visible promises:', total, 'Non-visible:', totalInDb - total);
  
  if (promises.length > 0) {
    promises.forEach((p, i) => {
      console.log(`[getVisiblePromises] Promise ${i + 1}: id=${p.id}, visibleAt=${p.visibleAt.toISOString()}, accusedName=${p.accusedName}`);
    });
  } else {
    console.log('[getVisiblePromises] WARNING: No visible promises found!');
    console.log('[getVisiblePromises] This means all promises have visibleAt > current time');
  }

  return {
    promises,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * DEBUG: Get ALL promises (including non-visible ones) - for troubleshooting only
 * This should be removed or secured in production
 */
export async function getAllPromisesDebug() {
  const now = new Date();
  const allPromises = await prisma.promiseReport.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('[getAllPromisesDebug] Total promises in database:', allPromises.length);
  allPromises.forEach((p, i) => {
    const isVisible = p.visibleAt <= now;
    console.log(`[getAllPromisesDebug] Promise ${i + 1}:`, {
      id: p.id,
      accusedName: p.accusedName,
      visibleAt: p.visibleAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      isVisible,
      timeUntilVisible: isVisible ? 'NOW' : `${Math.round((p.visibleAt.getTime() - now.getTime()) / 1000 / 60)} minutes`,
    });
  });

  return {
    currentTime: now.toISOString(),
    total: allPromises.length,
    promises: allPromises.map(p => ({
      ...p,
      isVisible: p.visibleAt <= now,
      timeUntilVisible: p.visibleAt <= now 
        ? 'NOW' 
        : `${Math.round((p.visibleAt.getTime() - now.getTime()) / 1000 / 60)} minutes`,
    })),
  };
}

