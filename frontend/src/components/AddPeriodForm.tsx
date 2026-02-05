import { useState, useEffect } from 'react';
import { Period, SymptomType } from '../api';

interface AddPeriodFormProps {
  onSubmit: (data: {
    start_date: string;
    end_date?: string;
    flow_intensity?: 'light' | 'moderate' | 'heavy';
    notes?: string;
    symptoms?: Array<{
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
    [key: string]: { severity: number; notes: string };
  }>({});

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

  // Populate form when editing
  useEffect(() => {
    if (editingPeriod) {
      setStartDate(editingPeriod.start_date);
      setEndDate(editingPeriod.end_date || '');
      setFlowIntensity(editingPeriod.flow_intensity || '');
      setNotes(editingPeriod.notes || '');
    } else {
      // Reset form when not editing
      setStartDate('');
      setEndDate('');
      setFlowIntensity('');
      setNotes('');
      setSelectedSymptoms({});
    }
  }, [editingPeriod]);

  const toggleSymptom = (symptomType: SymptomType) => {
    if (selectedSymptoms[symptomType]) {
      const updated = { ...selectedSymptoms };
      delete updated[symptomType];
      setSelectedSymptoms(updated);
    } else {
      setSelectedSymptoms({
        ...selectedSymptoms,
        [symptomType]: { severity: 3, notes: '' },
      });
    }
  };

  const updateSeverity = (symptomType: SymptomType, severity: number) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [symptomType]: { ...selectedSymptoms[symptomType], severity },
    });
  };

  const updateSymptomNotes = (symptomType: SymptomType, symptomNotes: string) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [symptomType]: { ...selectedSymptoms[symptomType], notes: symptomNotes },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Convert symptoms to array format
      const symptoms = Object.entries(selectedSymptoms).map(([symptom_type, data]) => ({
        symptom_type: symptom_type as SymptomType,
        severity: data.severity,
        notes: data.notes || undefined,
      }));

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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symptoms (optional)
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {SYMPTOM_OPTIONS.map((symptom) => (
              <button
                key={symptom.type}
                type="button"
                onClick={() => toggleSymptom(symptom.type)}
                className={`p-2.5 rounded-lg border-2 transition-all font-medium text-sm flex flex-col items-center gap-1 ${
                  selectedSymptoms[symptom.type]
                    ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                    : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:shadow-sm'
                }`}
              >
                <span className="text-xl">{symptom.icon}</span>
                <span className="text-xs">{symptom.label}</span>
              </button>
            ))}
          </div>

          {/* Severity Sliders for Selected Symptoms */}
          {Object.keys(selectedSymptoms).length > 0 && (
            <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700">Severity & Notes</h4>
              
              {Object.entries(selectedSymptoms).map(([symptomType, data]) => {
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
                      onChange={(e) => updateSeverity(symptomType as SymptomType, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    
                    <input
                      type="text"
                      value={data.notes}
                      onChange={(e) => updateSymptomNotes(symptomType as SymptomType, e.target.value)}
                      placeholder="Optional notes about this symptom..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                );
              })}
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
