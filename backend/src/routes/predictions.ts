import { Router, Request, Response, NextFunction } from 'express';
import { predictionService } from '../services/predictionService';
import { authMiddleware } from '../middleware/auth';
import { cacheHelpers } from '../config/redis';

const router = Router();
router.use(authMiddleware);

// Prediction endpoints with Redis caching (v4)
// Cache TTL: 1 hour | Auto-invalidates on period updates
router.get('/next-period', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const cacheKey = `predictions:${userId}`;
    const cachedPrediction = await cacheHelpers.get(cacheKey);
    
    if (cachedPrediction) {
      return res.json({
        success: true,
        data: cachedPrediction,
        cached: true,
      });
    }
    
    // If not in cache, calculate prediction
    const prediction = await predictionService.predictNextPeriod(userId);
    
    const responseData = {
      next_period: {
        predicted_start_date: prediction.predictedStartDate.toISOString().split('T')[0],
        predicted_end_date: prediction.predictedEndDate.toISOString().split('T')[0],
        confidence_score: prediction.confidenceScore,
        predicted_flow_intensity: prediction.predictedFlowIntensity,
      },
      ovulation: {
        predicted_start_date: prediction.ovulationStart.toISOString().split('T')[0],
        predicted_end_date: prediction.ovulationEnd.toISOString().split('T')[0],
      },
      cycle_stats: {
        avg_cycle_length: Math.round(prediction.cycleStats.avgCycleLength),
        avg_period_length: Math.round(prediction.cycleStats.avgPeriodLength),
        cycle_regularity: prediction.cycleStats.regularity,
        cycle_variation: prediction.cycleStats.standardDeviation.toFixed(2),
        cycles_tracked: prediction.cycleStats.cyclesTracked,
        standard_deviation: prediction.cycleStats.standardDeviation.toFixed(2),
      },
    };
    
    await cacheHelpers.set(cacheKey, responseData, 3600);
    
    res.json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/calendar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const months = parseInt(req.query.months as string) || 3;
    const numberOfCycles = Math.min(months, 6);
    
    const result = await predictionService.predictMultipleCycles(userId, numberOfCycles);
    
    res.json({
      success: true,
      data: {
        predictions: result.predictions.map(p => ({
          cycle_number: p.cycleNumber,
          predicted_start_date: p.predictedStartDate.toISOString().split('T')[0],
          predicted_end_date: p.predictedEndDate.toISOString().split('T')[0],
          ovulation_start: p.ovulationStart.toISOString().split('T')[0],
          ovulation_end: p.ovulationEnd.toISOString().split('T')[0],
          confidence_score: p.confidenceScore,
          predicted_flow_intensity: p.predictedFlowIntensity,
        })),
        cycle_stats: {
          avg_cycle_length: Math.round(result.cycleStats.avgCycleLength),
          avg_period_length: Math.round(result.cycleStats.avgPeriodLength),
          cycle_regularity: result.cycleStats.regularity,
          cycle_variation: result.cycleStats.standardDeviation.toFixed(2),
          cycles_tracked: result.cycleStats.cyclesTracked,
          standard_deviation: result.cycleStats.standardDeviation.toFixed(2),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
