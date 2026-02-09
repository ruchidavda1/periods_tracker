import { useState, useEffect } from 'react';
import { Prediction, predictionAPI } from '../api';

interface PredictionCardProps {
  prediction: Prediction;
  allPredictions?: Prediction[];
}

export default function PredictionCard({ prediction, allPredictions = [] }: PredictionCardProps) {
  const [multiplePredictions, setMultiplePredictions] = useState<Prediction[]>(allPredictions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Only fetch if not provided
  useEffect(() => {
    if (allPredictions.length > 0) {
      setMultiplePredictions(allPredictions);
      return;
    }
    
    const fetchMultiplePredictions = async () => {
      setIsLoading(true);
      try {
        const data = await predictionAPI.getCalendar(3);
        console.log('Calendar API response:', data);
        setMultiplePredictions(data.predictions || []);
      } catch (error) {
        console.error('Failed to fetch multiple predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMultiplePredictions();
  }, [allPredictions]);

  const getRegularityColor = (regularity: string) => {
    switch (regularity) {
      case 'very_regular':
        return 'text-green-600 bg-green-50';
      case 'regular':
        return 'text-blue-600 bg-blue-50';
      case 'somewhat_irregular':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const getVariationColor = (stdDev: number) => {
    if (stdDev < 2) return 'text-green-600 bg-green-50';
    if (stdDev < 4) return 'text-blue-600 bg-blue-50';
    if (stdDev < 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getVariationLabel = (stdDev: number) => {
    if (stdDev < 2) return 'Very Typical';
    if (stdDev < 4) return 'Typical';
    if (stdDev < 7) return 'Variable';
    return 'Atypical';
  };

  const formatVariation = (stdDev: string) => {
    const value = parseFloat(stdDev);
    if (value < 0.5) return '< 1';
    return value.toFixed(1);
  };

  const getFlowColor = (intensity: string | null) => {
    switch (intensity) {
      case 'light':
        return 'text-blue-600 bg-blue-50';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'heavy':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-5"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-800">Next Period Prediction</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className={`p-2 rounded-lg transition-colors ${
              currentIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex(Math.min(multiplePredictions.length - 1, currentIndex + 1))}
            disabled={currentIndex === multiplePredictions.length - 1}
            className={`p-2 rounded-lg transition-colors ${
              currentIndex === multiplePredictions.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {multiplePredictions.map((pred, index) => {
            const cycleConfidence = Math.round(pred.confidence_score * 100);
            const daysUntil = Math.ceil(
              (new Date(pred.predicted_start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={index} className="min-w-full">
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Period Card */}
                  <div className={`rounded-xl p-5 border ${
                    index === 0
                      ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200'
                      : index === 1
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                      : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-base font-semibold ${
                        index === 0 ? 'text-primary-800' : index === 1 ? 'text-blue-800' : 'text-indigo-800'
                      }`}>
                        {index === 0 ? 'Next Period' : `Cycle ${pred.cycle_number} Period`}
                      </h3>
                      <span className={`text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm ${
                        index === 0 ? 'text-primary-600' : index === 1 ? 'text-blue-600' : 'text-indigo-600'
                      }`}>
                        {cycleConfidence}%
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className={`text-xs mb-1 ${
                          index === 0 ? 'text-primary-700' : index === 1 ? 'text-blue-700' : 'text-indigo-700'
                        }`}>
                          Start Date
                        </p>
                        <p className={`text-lg font-bold ${
                          index === 0 ? 'text-primary-900' : index === 1 ? 'text-blue-900' : 'text-indigo-900'
                        }`}>
                          {formatDate(pred.predicted_start_date)}
                        </p>
                      </div>
                      
                      <div>
                        <p className={`text-xs mb-1 ${
                          index === 0 ? 'text-primary-700' : index === 1 ? 'text-blue-700' : 'text-indigo-700'
                        }`}>
                          End Date
                        </p>
                        <p className={`text-lg font-bold ${
                          index === 0 ? 'text-primary-900' : index === 1 ? 'text-blue-900' : 'text-indigo-900'
                        }`}>
                          {formatDate(pred.predicted_end_date)}
                        </p>
                      </div>
                      
                      <div className={`pt-3 border-t ${
                        index === 0 ? 'border-primary-200' : index === 1 ? 'border-blue-200' : 'border-indigo-200'
                      }`}>
                        <p className={`text-base font-semibold ${
                          index === 0 ? 'text-primary-800' : index === 1 ? 'text-blue-800' : 'text-indigo-800'
                        }`}>
                          {daysUntil > 0 ? `${daysUntil} days away` : 'Expected today'}
                        </p>
                      </div>

                      {/* Expected Flow Intensity */}
                      {pred.predicted_flow_intensity && (
                        <div className={`pt-3 border-t ${
                          index === 0 ? 'border-primary-200' : index === 1 ? 'border-blue-200' : 'border-indigo-200'
                        }`}>
                          <p className={`text-xs mb-2 ${
                            index === 0 ? 'text-primary-700' : index === 1 ? 'text-blue-700' : 'text-indigo-700'
                          }`}>
                            Expected Flow
                          </p>
                          <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${getFlowColor(pred.predicted_flow_intensity)}`}>
                            {pred.predicted_flow_intensity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ovulation Window Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-purple-800">Fertile Window</h3>
                      <span className="text-sm text-purple-600 bg-white px-3 py-1 rounded-full shadow-sm">
                        Ovulation
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-purple-700 mb-1">Window Start</p>
                        <p className="text-lg font-bold text-purple-900">
                          {formatDate(pred.ovulation_start)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-purple-700 mb-1">Window End</p>
                        <p className="text-lg font-bold text-purple-900">
                          {formatDate(pred.ovulation_end)}
                        </p>
                      </div>
                      
                      <div className="pt-3 border-t border-purple-200">
                        <p className="text-xs text-purple-700">
                          Most fertile days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-5">
        {multiplePredictions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary-600 w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Cycle Stats - Only show if available */}
      {prediction.cycle_stats && (
        <>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Avg Cycle</p>
              <p className="text-xl font-bold text-gray-800">
                {prediction.cycle_stats.avg_cycle_length}<span className="text-sm ml-1">days</span>
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Cycle Variation</p>
              <p className="text-xl font-bold text-gray-800">
                {formatVariation(prediction.cycle_stats.standard_deviation)}<span className="text-sm ml-1">days</span>
              </p>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1.5 ${getVariationColor(parseFloat(prediction.cycle_stats.standard_deviation))}`}>
                {getVariationLabel(parseFloat(prediction.cycle_stats.standard_deviation))}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Avg Period</p>
              <p className="text-xl font-bold text-gray-800">
                {prediction.cycle_stats.avg_period_length}<span className="text-sm ml-1">days</span>
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Tracked</p>
              <p className="text-xl font-bold text-gray-800">
                {prediction.cycle_stats.cycles_tracked}<span className="text-sm ml-1">cycles</span>
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2">Regularity</p>
              <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${getRegularityColor(prediction.cycle_stats.cycle_regularity)}`}>
                {prediction.cycle_stats.cycle_regularity.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
            {prediction.cycle_stats.cycles_tracked < 3 ? (
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">Limited Data - Using Default Prediction</p>
                  <p className="text-xs text-blue-700">
                    You've tracked {prediction.cycle_stats.cycles_tracked} cycle{prediction.cycle_stats.cycles_tracked !== 1 ? 's' : ''}. 
                    Add at least 3 cycles for personalized predictions based on your actual patterns. Currently using default standard cycle length of 28 days.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-blue-800">
                Based on last {prediction.cycle_stats.cycles_tracked} cycles using weighted averages
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
