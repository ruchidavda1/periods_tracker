import { Router, Request, Response } from 'express';
import Symptom from '../models/Symptom';
import Period from '../models/Period';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/patterns', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const periods = await Period.findAll({
      where: { user_id: userId },
      include: [{
        model: Symptom,
        as: 'symptoms',
      }],
      order: [['start_date', 'DESC']],
    });

    const symptomStats: { [key: string]: { count: number; totalSeverity: number; avgSeverity: number; frequency: number } } = {};
    let totalPeriods = periods.length;

    periods.forEach(period => {
      const symptoms = (period as any).symptoms || [];
      symptoms.forEach((symptom: any) => {
        const type = symptom.symptom_type;
        if (!symptomStats[type]) {
          symptomStats[type] = { count: 0, totalSeverity: 0, avgSeverity: 0, frequency: 0 };
        }
        symptomStats[type].count++;
        symptomStats[type].totalSeverity += symptom.severity;
      });
    });

    Object.keys(symptomStats).forEach(type => {
      symptomStats[type].avgSeverity = symptomStats[type].totalSeverity / symptomStats[type].count;
      symptomStats[type].frequency = symptomStats[type].count / totalPeriods;
    });

    const patterns = Object.entries(symptomStats)
      .map(([type, stats]) => ({
        symptom_type: type,
        frequency: Math.round(stats.frequency * 100),
        avg_severity: Math.round(stats.avgSeverity * 10) / 10, // 1 decimal
        occurrences: stats.count,
      }))
      .sort((a, b) => b.frequency - a.frequency);

    res.json({
      success: true,
      data: {
        patterns,
        total_periods: totalPeriods,
      },
    });
  } catch (error) {
    console.error('Error fetching symptom patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symptom patterns',
    });
  }
});

// DELETE /api/symptoms/:id - Delete symptom
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify symptom belongs to user's period
    const symptom = await Symptom.findOne({
      where: { id },
      include: [{
        model: Period,
        as: 'period',
        where: { user_id: userId },
      }],
    });

    if (!symptom) {
      res.status(404).json({
        success: false,
        error: 'Symptom not found',
      });
      return;
    }

    await symptom.destroy();

    res.json({
      success: true,
      message: 'Symptom deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete symptom',
    });
  }
});

export default router;
