import { useState, useEffect } from 'react';
import { Period, SymptomType } from '../api';

interface AddPeriodFormProps {
  onSubmit: (data: {
    start_date: string;
    end_date?: string;
    flow_intensity?: 'light' | 'moderate' | 'heavy';
    notes?: string;
    symptoms?: Array<{
      date: string;
      symptom_type: SymptomType;
      severity: number;
      notes?: string;
    }>;
  }) => Promise<void>;
  onCancel: () => void;
  editingPeriod?: Period | null;
}

export default function AddPeriodForm({ onSubmit, onCancel, editingPeriod }: AddPeriodFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flowIntensity, setFlowIntensity] = useState<'light' | 'moderate' | 'heavy' | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<{
    [date: string]: {
      [symptomType: string]: { severity: number; notes: string };
    };
  }>({});
  const [showDayByDay, setShowDayByDay] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const SYMPTOM_OPTIONS = [
    { type: 'cramps' as SymptomType, label: 'Cramps', icon: '🩹' },
    { type: 'headache' as SymptomType, label: 'Headache', icon: '🤕' },
    { type: 'mood_swings' as SymptomType, label: 'Mood Swings', icon: '😢' },
    { type: 'fatigue' as SymptomType, label: 'Fatigue', icon: '😴' },
    { type: 'bloating' as SymptomType, label: 'Bloating', icon: '🎈' },
    { type: 'acne' as SymptomType, label: 'Acne', icon: '🔴' },
    { type: 'other' as SymptomType, label: 'Other', icon: '📝' },
  ];

  // Get days in period range
  const getPeriodDays = () => {
    if (!startDate) return [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    const days: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split('T')[0]);
    }
    
    return days;
  };

  // Populate form when editing
  useEffect(() => {
    if (editingPeriod) {
      setStartDate(editingPeriod.start_date);
      setEndDate(editingPeriod.end_date || '');
      setFlowIntensity(editingPeriod.flow_intensity || '');
      setNotes(editingPeriod.notes || '');
      
      // Load existing symptoms (grouped by date)
      const existingSymptoms: { [date: string]: { [symptomType: string]: { severity: number; notes: string } } } = {};
      const periodSymptoms = (editingPeriod as any).symptoms || [];
      
      periodSymptoms.forEach((symptom: any) => {
        const symptomDate = symptom.date || editingPeriod.start_date;
        if (!existingSymptoms[symptomDate]) {
          existingSymptoms[symptomDate] = {};
        }
        existingSymptoms[symptomDate][symptom.symptom_type] = {
          severity: symptom.severity,
          notes: symptom.notes || '',
        };
      });
      
      setSelectedSymptoms(existingSymptoms);
    } else {
      // Reset form when not editing
      setStartDate('');
      setEndDate('');
      setFlowIntensity('');
      setNotes('');
      setSelectedSymptoms({});
      setShowDayByDay(false);
    }
  }, [editingPeriod]);

  const toggleSymptom = (symptomType: SymptomType, date?: string) => {
    const targetDate = date || startDate;
    if (!targetDate) return;
    
    const updated = { ...selectedSymptoms };
    if (!updated[targetDate]) {
      updated[targetDate] = {};
    }
    
    if (updated[targetDate][symptomType]) {
      delete updated[targetDate][symptomType];
      if (Object.keys(updated[targetDate]).length === 0) {
        delete updated[targetDate];
      }
    } else {
      updated[targetDate][symptomType] = { severity: 3, notes: '' };
    }
    
    setSelectedSymptoms(updated);
  };

  const updateSeverity = (symptomType: SymptomType, severity: number, date: string) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [date]: {
        ...selectedSymptoms[date],
        [symptomType]: { ...selectedSymptoms[date][symptomType], severity },
      },
    });
  };

  const updateSymptomNotes = (symptomType: SymptomType, symptomNotes: string, date: string) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [date]: {
        ...selectedSymptoms[date],
        [symptomType]: { ...selectedSymptoms[date][symptomType], notes: symptomNotes },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Convert symptoms to array format (with dates)
      const symptoms: Array<{
        date: string;
        symptom_type: SymptomType;
        severity: number;
        notes?: string;
      }> = [];
      
      Object.entries(selectedSymptoms).forEach(([date, symptomsForDate]) => {
        Object.entries(symptomsForDate).forEach(([symptomType, data]) => {
          symptoms.push({
            date,
            symptom_type: symptomType as SymptomType,
            severity: data.severity,
            notes: data.notes || undefined,
          });
        });
      });

      await onSubmit({
        start_date: startDate,
        end_date: endDate || undefined,
        flow_intensity: flowIntensity || undefined,
        notes: notes || undefined,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
      });
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setFlowIntensity('');
      setNotes('');
      setSelectedSymptoms({});
    } catch (err: any) {
      setError(err.message || 'Failed to add period');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {editingPeriod ? 'Edit Period' : 'Log New Period'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={today}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white [color-scheme:light]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={today}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white [color-scheme:light]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Flow Intensity (optional)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFlowIntensity('light')}
              className={`py-2.5 px-4 rounded-lg border-2 transition-all font-medium ${
                flowIntensity === 'light'
                  ? 'border-blue-400 bg-blue-100 text-blue-800 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:shadow-sm'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setFlowIntensity('moderate')}
              className={`py-2.5 px-4 rounded-lg border-2 transition-all font-medium ${
                flowIntensity === 'moderate'
                  ? 'border-yellow-400 bg-yellow-100 text-yellow-800 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:shadow-sm'
              }`}
            >
              Moderate
            </button>
            <button
              type="button"
              onClick={() => setFlowIntensity('heavy')}
              className={`py-2.5 px-4 rounded-lg border-2 transition-all font-medium ${
                flowIntensity === 'heavy'
                  ? 'border-red-400 bg-red-100 text-red-800 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:shadow-sm'
              }`}
            >
              Heavy
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
            rows={2}
            placeholder="Any observations or general notes..."
          />
        </div>

        {/* Symptom Tracker */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Symptoms (optional)
            </label>
            {startDate && (
              <button
                type="button"
                onClick={() => setShowDayByDay(!showDayByDay)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {showDayByDay ? 'Simple View' : 'Day-by-Day View'}
              </button>
            )}
          </div>

          {!showDayByDay ? (
            /* Simple View - All symptoms for entire period */
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {SYMPTOM_OPTIONS.map((symptom) => {
                  const hasSymptom = Object.values(selectedSymptoms).some(
                    daySymptoms => daySymptoms[symptom.type]
                  );
                  return (
                    <button
                      key={symptom.type}
                      type="button"
                      onClick={() => toggleSymptom(symptom.type, startDate)}
                      className={`p-2.5 rounded-lg border-2 transition-all font-medium text-sm flex flex-col items-center gap-1 ${
                        hasSymptom
                          ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                          : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-xl">{symptom.icon}</span>
                      <span className="text-xs">{symptom.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Severity Sliders for Selected Symptoms */}
              {startDate && selectedSymptoms[startDate] && Object.keys(selectedSymptoms[startDate]).length > 0 && (
                <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700">Severity & Notes</h4>
                  
                  {Object.entries(selectedSymptoms[startDate]).map(([symptomType, data]) => {
                    const symptomInfo = SYMPTOM_OPTIONS.find(s => s.type === symptomType);
                    return (
                      <div key={symptomType} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            {symptomInfo?.icon} {symptomInfo?.label}
                          </label>
                          <span className="text-sm font-semibold text-primary-600">
                            {data.severity}/5
                          </span>
                        </div>
                        
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={data.severity}
                          onChange={(e) => updateSeverity(symptomType as SymptomType, parseInt(e.target.value), startDate)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        
                        <input
                          type="text"
                          value={data.notes}
                          onChange={(e) => updateSymptomNotes(symptomType as SymptomType, e.target.value, startDate)}
                          placeholder="Optional notes about this symptom..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Day-by-Day View - Track symptoms per day */
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              {getPeriodDays().map((date, index) => (
                <div key={date} className="bg-white p-3 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Day {index + 1} - {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h4>
                  
                  {/* Symptom buttons for this day */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {SYMPTOM_OPTIONS.map((symptom) => (
                      <button
                        key={symptom.type}
                        type="button"
                        onClick={() => toggleSymptom(symptom.type, date)}
                        className={`p-2 rounded-lg border-2 transition-all text-xs flex flex-col items-center gap-1 ${
                          selectedSymptoms[date]?.[symptom.type]
                            ? 'border-primary-500 bg-primary-50 text-primary-800'
                            : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
                        }`}
                        title={symptom.label}
                      >
                        <span className="text-lg">{symptom.icon}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Severity sliders for symptoms on this day */}
                  {selectedSymptoms[date] && Object.keys(selectedSymptoms[date]).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      {Object.entries(selectedSymptoms[date]).map(([symptomType, data]) => {
                        const symptomInfo = SYMPTOM_OPTIONS.find(s => s.type === symptomType);
                        return (
                          <div key={symptomType} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-700">
                                {symptomInfo?.icon} {symptomInfo?.label}
                              </label>
                              <span className="text-xs font-semibold text-primary-600">
                                {data.severity}/5
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={data.severity}
                              onChange={(e) => updateSeverity(symptomType as SymptomType, parseInt(e.target.value), date)}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? 'Saving...' : (editingPeriod ? 'Update Period' : 'Save Period')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
