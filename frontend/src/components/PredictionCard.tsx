import { Prediction } from '../api';

interface PredictionCardProps {
  prediction: Prediction;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const confidencePercentage = Math.round(prediction.next_period.confidence_score * 100);
  
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

  const getVariationColor = (stdDev: number) => {
    if (stdDev < 2) return 'text-green-600 bg-green-50'; // Very consistent
    if (stdDev < 4) return 'text-blue-600 bg-blue-50';  // Typical
    if (stdDev < 7) return 'text-yellow-600 bg-yellow-50'; // Variable
    return 'text-orange-600 bg-orange-50'; // Highly variable
  };

  const getVariationLabel = (stdDev: number) => {
    if (stdDev < 2) return 'Very Typical';
    if (stdDev < 4) return 'Typical';
    if (stdDev < 7) return 'Variable';
    return 'Atypical';
  };

  const formatVariation = (stdDev: string) => {
    const value = parseFloat(stdDev);
    // If less than 0.5, show as "< 1" instead of 0.00
    if (value < 0.5) return '< 1';
    // Round to 1 decimal place
    return value.toFixed(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysUntilPeriod = Math.ceil(
    (new Date(prediction.next_period.predicted_start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-5">Next Period Prediction</h2>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Next Period Card */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-5 border border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-primary-800">Next Period</h3>
            <span className="text-sm font-medium text-primary-600 bg-white px-3 py-1 rounded-full shadow-sm">
              {confidencePercentage}%
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-primary-700 mb-1">Start Date</p>
              <p className="text-lg font-bold text-primary-900">
                {formatDate(prediction.next_period.predicted_start_date)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-primary-700 mb-1">End Date</p>
              <p className="text-lg font-bold text-primary-900">
                {formatDate(prediction.next_period.predicted_end_date)}
              </p>
            </div>
            
            <div className="pt-3 border-t border-primary-200">
              <p className="text-base font-semibold text-primary-800">
                {daysUntilPeriod > 0 ? `${daysUntilPeriod} days away` : 'Expected today'}
              </p>
            </div>

            {prediction.next_period.predicted_flow_intensity && (
              <div className="pt-3 border-t border-primary-200">
                <p className="text-xs text-primary-700 mb-2">Expected Flow</p>
                <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${getFlowColor(prediction.next_period.predicted_flow_intensity)}`}>
                  {prediction.next_period.predicted_flow_intensity}
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
                {formatDate(prediction.ovulation.predicted_start_date)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-purple-700 mb-1">Window End</p>
              <p className="text-lg font-bold text-purple-900">
                {formatDate(prediction.ovulation.predicted_end_date)}
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

      {/* Cycle Stats */}
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
                Add at least 3 cycles for personalized predictions based on your actual patterns.Currently using default prediction.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-blue-800">
            Based on last {prediction.cycle_stats.cycles_tracked} cycles using weighted averages
          </p>
        )}
      </div>
    </div>
  );
}
