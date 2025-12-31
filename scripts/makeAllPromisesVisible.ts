import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Script to make all existing promises visible immediately
 * This sets visibleAt to the past so they become visible right away
 */
async function makeAllPromisesVisible() {
  try {
    const now = new Date();
    const pastTime = new Date(now.getTime() - 1000); // 1 second ago

    console.log('Making all promises visible...');
    console.log('Current time:', now.toISOString());
    console.log('Setting visibleAt to:', pastTime.toISOString());

    const result = await prisma.promiseReport.updateMany({
      where: {
        visibleAt: {
          gt: now, // Only update promises that are not yet visible
        },
      },
      data: {
        visibleAt: pastTime,
      },
    });

    console.log(`✅ Updated ${result.count} promise(s) to be visible immediately!`);
    
    // Show all promises
    const allPromises = await prisma.promiseReport.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\nTotal promises in database: ${allPromises.length}`);
    allPromises.forEach((p, i) => {
      const isVisible = p.visibleAt <= now;
      console.log(`\nPromise ${i + 1}:`);
      console.log(`  ID: ${p.id}`);
      console.log(`  Accused: ${p.accusedName}`);
      console.log(`  Visible At: ${p.visibleAt.toISOString()}`);
      console.log(`  Is Visible: ${isVisible ? '✅ YES' : '❌ NO'}`);
    });
  } catch (error) {
    console.error('❌ Error making promises visible:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAllPromisesVisible();

