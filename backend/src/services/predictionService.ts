import Period from '../models/Period';
import UserSettings from '../models/UserSettings';
import Prediction from '../models/Prediction';
import { Op } from 'sequelize';

interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  standardDeviation: number;
  regularity: 'very_regular' | 'regular' | 'somewhat_irregular' | 'irregular';
  cyclesTracked: number;
}

interface PredictionResult {
  predictedStartDate: Date;
  predictedEndDate: Date;
  ovulationStart: Date;
  ovulationEnd: Date;
  confidenceScore: number;
  predictedFlowIntensity: 'light' | 'moderate' | 'heavy' | null;
}

interface MultiplePredictions {
  predictions: Array<PredictionResult & { cycleNumber: number }>;
  cycleStats: CycleStats;
}

export class PredictionService {
  async predictNextPeriod(userId: string): Promise<PredictionResult & { cycleStats: CycleStats }> {
    const periods = await Period.findAll({
      where: { 
        user_id: userId,
        end_date: { [Op.ne]: null }
      },
      order: [['start_date', 'DESC']],
      limit: 12,
      raw: true,
    });

    if (periods.length < 3) {
      return this.useDefaultPrediction(userId, periods);
    }

    const cycleStats = this.calculateCycleStats(periods);
    const predictedCycleLength = this.calculateWeightedCycleLength(periods);
    const lastPeriodStart = new Date(periods[0].start_date);
    const predictedStartDate = this.addDays(lastPeriodStart, Math.round(predictedCycleLength));
    const avgPeriodLength = this.calculateAveragePeriodLength(periods);
    const predictedEndDate = this.addDays(predictedStartDate, Math.round(avgPeriodLength) - 1);
    const ovulationDay = this.addDays(predictedStartDate, -14);
    const ovulationStart = this.addDays(ovulationDay, -5);
    const ovulationEnd = this.addDays(ovulationDay, 1);
    const confidenceScore = this.calculateConfidence(
      cycleStats.standardDeviation,
      periods.length,
      cycleStats.avgCycleLength
    );
    const predictedFlowIntensity = this.predictFlowIntensity(periods);

    await this.savePrediction(userId, {
      predictedStartDate,
      predictedEndDate,
      ovulationStart,
      ovulationEnd,
      confidenceScore,
      predictedFlowIntensity,
    });

    await this.updateUserSettings(userId, cycleStats);

    return {
      predictedStartDate,
      predictedEndDate,
      ovulationStart,
      ovulationEnd,
      confidenceScore,
      predictedFlowIntensity,
      cycleStats,
    };
  }

  private predictFlowIntensity(periods: any[]): 'light' | 'moderate' | 'heavy' | null {
    // Get the last 6 periods with flow intensity data
    const periodsWithFlow = periods
      .filter(p => p.flow_intensity)
      .slice(0, 6);

    if (periodsWithFlow.length === 0) {
      return null; // No data to predict from
    }

    // Count occurrences of each intensity
    const intensityCounts = {
      light: 0,
      moderate: 0,
      heavy: 0,
    };

    periodsWithFlow.forEach(period => {
      if (period.flow_intensity) {
        intensityCounts[period.flow_intensity as keyof typeof intensityCounts]++;
      }
    });

    // Give more weight to recent periods
    const recentPeriods = periodsWithFlow.slice(0, 3);
    recentPeriods.forEach(period => {
      if (period.flow_intensity) {
        intensityCounts[period.flow_intensity as keyof typeof intensityCounts] += 0.5;
      }
    });

    // Return the most common intensity
    const maxCount = Math.max(...Object.values(intensityCounts));
    const mostCommon = Object.entries(intensityCounts).find(
      ([_, count]) => count === maxCount
    );

    return mostCommon ? (mostCommon[0] as 'light' | 'moderate' | 'heavy') : 'moderate';
  }

  async predictMultipleCycles(userId: string, numberOfCycles: number = 3): Promise<MultiplePredictions> {
    const firstPrediction = await this.predictNextPeriod(userId);
    const predictions: Array<PredictionResult & { cycleNumber: number }> = [
      { ...firstPrediction, cycleNumber: 1 }
    ];

    const avgCycleLength = firstPrediction.cycleStats.avgCycleLength;
    
    for (let i = 1; i < numberOfCycles; i++) {
      const previousPrediction = predictions[i - 1];
      
      const predictedStartDate = this.addDays(previousPrediction.predictedStartDate, avgCycleLength);
      const predictedEndDate = this.addDays(
        predictedStartDate,
        Math.round(firstPrediction.cycleStats.avgPeriodLength) - 1
      );
      
      const ovulationDay = this.addDays(predictedStartDate, -14);
      const ovulationStart = this.addDays(ovulationDay, -5);
      const ovulationEnd = this.addDays(ovulationDay, 1);
      const confidenceScore = firstPrediction.confidenceScore * Math.pow(0.95, i);
      
      predictions.push({
        cycleNumber: i + 1,
        predictedStartDate,
        predictedEndDate,
        ovulationStart,
        ovulationEnd,
        confidenceScore: Math.max(confidenceScore, 0.40),
        predictedFlowIntensity: firstPrediction.predictedFlowIntensity,
      });
    }

    return {
      predictions,
      cycleStats: firstPrediction.cycleStats,
    };
  }

  private calculateCycleStats(periods: any[]): CycleStats {
    const cycleLengths = this.calculateCycleLengths(periods);
    const periodLengths = periods
      .filter(p => p.end_date)
      .map(p => this.daysBetween(new Date(p.start_date), new Date(p.end_date)) + 1);

    const avgCycleLength = this.average(cycleLengths);
    const avgPeriodLength = this.average(periodLengths);
    const standardDeviation = this.standardDeviation(cycleLengths);
    
    let regularity: CycleStats['regularity'];
    if (standardDeviation < 2) regularity = 'very_regular';
    else if (standardDeviation < 4) regularity = 'regular';
    else if (standardDeviation < 7) regularity = 'somewhat_irregular';
    else regularity = 'irregular';

    return {
      avgCycleLength,
      avgPeriodLength,
      standardDeviation,
      regularity,
      cyclesTracked: cycleLengths.length,
    };
  }

  private calculateWeightedCycleLength(periods: any[]): number {
    const cycleLengths = this.calculateCycleLengths(periods);
    const recent3 = cycleLengths.slice(0, Math.min(3, cycleLengths.length));
    const middle3 = cycleLengths.slice(3, Math.min(6, cycleLengths.length));
    const older = cycleLengths.slice(6);
    
    const recentAvg = recent3.length > 0 ? this.average(recent3) : 0;
    const middleAvg = middle3.length > 0 ? this.average(middle3) : recentAvg;
    const olderAvg = older.length > 0 ? this.average(older) : middleAvg;
    
    if (cycleLengths.length <= 3) return recentAvg;
    else if (cycleLengths.length <= 6) return recentAvg * 0.7 + middleAvg * 0.3;
    else return recentAvg * 0.5 + middleAvg * 0.3 + olderAvg * 0.2;
  }

  private calculateCycleLengths(periods: any[]): number[] {
    const cycleLengths: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const currentStart = new Date(periods[i].start_date);
      const previousStart = new Date(periods[i + 1].start_date);
      const cycleLength = this.daysBetween(previousStart, currentStart);
      if (cycleLength >= 21 && cycleLength <= 45) {
        cycleLengths.push(cycleLength);
      }
    }
    return cycleLengths;
  }

  private calculateAveragePeriodLength(periods: any[]): number {
    const periodLengths = periods
      .filter(p => p.end_date)
      .map(p => this.daysBetween(new Date(p.start_date), new Date(p.end_date)) + 1)
      .filter(length => length >= 2 && length <= 10);
    return periodLengths.length > 0 ? this.average(periodLengths) : 5;
  }

  private calculateConfidence(stdDev: number, dataPoints: number, avgCycleLength: number): number {
    let baseConfidence: number;
    if (stdDev < 2) baseConfidence = 0.92;
    else if (stdDev < 4) baseConfidence = 0.82;
    else if (stdDev < 7) baseConfidence = 0.67;
    else baseConfidence = 0.50;
    
    const dataBoost = Math.min(dataPoints / 12, 1.0) * 0.08;
    const cycleAdjustment = (avgCycleLength >= 26 && avgCycleLength <= 32) ? 0 : -0.05;
    const finalConfidence = baseConfidence + dataBoost + cycleAdjustment;
    
    return Math.max(0.40, Math.min(0.95, finalConfidence));
  }

  private async useDefaultPrediction(userId: string, periods: any[]): Promise<PredictionResult & { cycleStats: CycleStats }> {
    const settings = await UserSettings.findOne({ where: { user_id: userId }, raw: true });
    const avgCycleLength = settings?.avg_cycle_length || 28;
    const avgPeriodLength = settings?.avg_period_length || 5;
    const lastPeriodStart = periods.length > 0 ? new Date(periods[0].start_date) : new Date();
    const predictedStartDate = this.addDays(lastPeriodStart, avgCycleLength);
    const predictedEndDate = this.addDays(predictedStartDate, avgPeriodLength - 1);
    const ovulationDay = this.addDays(predictedStartDate, -14);
    const ovulationStart = this.addDays(ovulationDay, -5);
    const ovulationEnd = this.addDays(ovulationDay, 1);
    const confidenceScore = 0.40 + (periods.length * 0.1);

    return {
      predictedStartDate,
      predictedEndDate,
      ovulationStart,
      ovulationEnd,
      confidenceScore,
      predictedFlowIntensity: null,
      cycleStats: {
        avgCycleLength,
        avgPeriodLength,
        standardDeviation: 0,
        regularity: 'irregular',
        cyclesTracked: periods.length,
      },
    };
  }

  private async savePrediction(userId: string, prediction: PredictionResult): Promise<void> {
    await Prediction.create({
      user_id: userId,
      predicted_start_date: prediction.predictedStartDate,
      predicted_end_date: prediction.predictedEndDate,
      ovulation_start: prediction.ovulationStart,
      ovulation_end: prediction.ovulationEnd,
      confidence_score: prediction.confidenceScore,
      predicted_flow_intensity: prediction.predictedFlowIntensity,
    });
  }

  private async updateUserSettings(userId: string, stats: CycleStats): Promise<void> {
    const [settings] = await UserSettings.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        avg_cycle_length: Math.round(stats.avgCycleLength),
        avg_period_length: Math.round(stats.avgPeriodLength),
        last_calculated_at: new Date(),
      },
    });

    await settings.update({
      avg_cycle_length: Math.round(stats.avgCycleLength),
      avg_period_length: Math.round(stats.avgPeriodLength),
      last_calculated_at: new Date(),
    });
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = this.average(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date2.getTime() - date1.getTime()) / oneDay));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

export const predictionService = new PredictionService();
