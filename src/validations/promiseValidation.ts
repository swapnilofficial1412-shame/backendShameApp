import { z } from 'zod';

export const createPromiseReportSchema = z.object({
  reporterName: z.string().optional(),
  accusedName: z.string().min(1, 'Accused name is required'),
  description: z.string().min(1, 'Description is required'),
  datePromised: z.string().datetime({ message: 'Invalid date format' }),
});

export type CreatePromiseReportInput = z.infer<typeof createPromiseReportSchema>;

