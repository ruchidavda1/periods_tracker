import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { Period } from '../models';

const router = Router();
router.use(authMiddleware);

const createPeriodSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  flow_intensity: z.enum(['light', 'moderate', 'heavy']).optional(),
  notes: z.string().optional(),
});

const updatePeriodSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  flow_intensity: z.enum(['light', 'moderate', 'heavy']).optional(),
  notes: z.string().optional(),
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validatedData = createPeriodSchema.parse(req.body);
    
    const period = await Period.create({
      user_id: userId,
      start_date: new Date(validatedData.start_date),
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : null,
      flow_intensity: validatedData.flow_intensity as any,
      notes: validatedData.notes,
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: period.id,
        user_id: period.user_id,
        start_date: period.start_date instanceof Date ? period.start_date.toISOString().split('T')[0] : period.start_date,
        end_date: period.end_date ? (period.end_date instanceof Date ? period.end_date.toISOString().split('T')[0] : period.end_date) : null,
        flow_intensity: period.flow_intensity,
        notes: period.notes,
        created_at: period.created_at.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      next(error);
    }
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const { count, rows: periods } = await Period.findAndCountAll({
      where: { user_id: userId },
      order: [['start_date', 'DESC']],
      limit,
      offset,
    });
    
    res.json({
      success: true,
      data: {
        periods: periods.map(p => ({
          id: p.id,
          start_date: p.start_date instanceof Date ? p.start_date.toISOString().split('T')[0] : p.start_date,
          end_date: p.end_date ? (p.end_date instanceof Date ? p.end_date.toISOString().split('T')[0] : p.end_date) : null,
          flow_intensity: p.flow_intensity,
          notes: p.notes,
          created_at: p.created_at.toISOString(),
        })),
        pagination: {
          total: count,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const periodId = req.params.id;
    
    const period = await Period.findOne({
      where: { id: periodId, user_id: userId },
      include: ['symptoms'],
    });
    
    if (!period) {
      res.status(404).json({
        success: false,
        error: 'Period not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        id: period.id,
        start_date: period.start_date instanceof Date ? period.start_date.toISOString().split('T')[0] : period.start_date,
        end_date: period.end_date ? (period.end_date instanceof Date ? period.end_date.toISOString().split('T')[0] : period.end_date) : null,
        flow_intensity: period.flow_intensity,
        notes: period.notes,
        symptoms: (period as any).symptoms || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const periodId = req.params.id;
    const validatedData = updatePeriodSchema.parse(req.body);
    
    const period = await Period.findOne({
      where: { id: periodId, user_id: userId },
    });
    
    if (!period) {
      res.status(404).json({
        success: false,
        error: 'Period not found',
      });
      return;
    }
    
    await period.update({
      start_date: validatedData.start_date ? new Date(validatedData.start_date) : period.start_date,
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : period.end_date,
      flow_intensity: validatedData.flow_intensity as any || period.flow_intensity,
      notes: validatedData.notes !== undefined ? validatedData.notes : period.notes,
    });
    
    res.json({
      success: true,
      data: {
        id: period.id,
        start_date: period.start_date instanceof Date ? period.start_date.toISOString().split('T')[0] : period.start_date,
        end_date: period.end_date ? (period.end_date instanceof Date ? period.end_date.toISOString().split('T')[0] : period.end_date) : null,
        flow_intensity: period.flow_intensity,
        notes: period.notes,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      next(error);
    }
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const periodId = req.params.id;
    
    const period = await Period.findOne({
      where: { id: periodId, user_id: userId },
    });
    
    if (!period) {
      res.status(404).json({
        success: false,
        error: 'Period not found',
      });
      return;
    }
    
    await period.destroy();
    
    res.json({
      success: true,
      message: 'Period deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
