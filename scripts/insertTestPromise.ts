import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function insertTestPromise() {
  try {
    const now = new Date();
    // Set visibleAt to now so it's immediately visible
    const visibleAt = new Date(now.getTime() - 1000); // 1 second ago to ensure it's visible

    const promise = await prisma.promiseReport.create({
      data: {
        reporterName: 'Test Reporter',
        accusedName: 'John Doe',
        description: 'Promised to finish the project by Friday but didn\'t deliver',
        datePromised: new Date('2024-01-15T10:00:00Z'),
        visibleAt: visibleAt,
      },
    });

    console.log('✅ Test promise inserted successfully!');
    console.log('Promise ID:', promise.id);
    console.log('Accused:', promise.accusedName);
    console.log('Description:', promise.description);
    console.log('Visible At:', promise.visibleAt);
    console.log('\nYou can now see this promise on the frontend dashboard!');
  } catch (error) {
    console.error('❌ Error inserting test promise:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

insertTestPromise();

