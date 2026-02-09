import { useEffect, useState } from 'react';
import { symptomAPI, SymptomPattern } from '../api';

export default function SymptomInsights() {
  const [patterns, setPatterns] = useState<SymptomPattern[]>([]);
  const [totalPeriods, setTotalPeriods] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      setIsLoading(true);
      const data = await symptomAPI.getPatterns();
      setPatterns(data.patterns);
      setTotalPeriods(data.total_periods);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load symptom patterns');
    } finally {
      setIsLoading(false);
    }
  };

  const getSymptomIcon = (symptomType: string) => {
    const icons: { [key: string]: string } = {
      cramps: '🩹',
      headache: '🤕',
      mood_swings: '😢',
      fatigue: '😴',
      bloating: '🎈',
      acne: '🔴',
      other: '📝',
    };
    return icons[symptomType] || '📝';
  };

  const formatSymptomType = (type: string, notes?: string) => {
    if (type === 'other' && notes) {
      return notes.charAt(0).toUpperCase() + notes.slice(1);
    }
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityColor = (severity: number) => {
    if (severity < 2) return 'bg-green-100 text-green-700';
    if (severity < 3.5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No symptom data yet</h3>
        <p className="text-gray-500">Track symptoms with your periods to see patterns over time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Symptom Insights</h2>
          <p className="text-sm text-gray-500 mt-1">Based on {totalPeriods} tracked cycles</p>
        </div>
        <div className="text-primary-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        {patterns.map((pattern) => (
          <div
            key={pattern.symptom_type}
            className="border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-3xl">{getSymptomIcon(pattern.symptom_type)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {formatSymptomType(pattern.symptom_type)}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Frequency</p>
                      <p className="text-sm font-bold text-primary-600">{pattern.frequency}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occurrences</p>
                      <p className="text-sm font-semibold text-gray-700">{pattern.occurrences}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <p className="text-xs text-gray-500 mb-1">Avg Severity</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getSeverityColor(pattern.avg_severity)}`}>
                  {pattern.avg_severity}/5
                </span>
              </div>
            </div>

            {/* Visual Chart - Frequency Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-500 relative"
                  style={{ width: `${pattern.frequency}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Pattern Recognition</p>
            <p className="text-xs text-blue-600 mt-1">
              These patterns help predict which symptoms you're likely to experience in future cycles.
              Track more cycles for better insights!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
