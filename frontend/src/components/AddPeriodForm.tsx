import { useState, useEffect } from 'react';
import { Period } from '../api';

interface AddPeriodFormProps {
  onSubmit: (data: {
    start_date: string;
    end_date?: string;
    flow_intensity?: 'light' | 'moderate' | 'heavy';
    notes?: string;
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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

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
    }
  }, [editingPeriod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit({
        start_date: startDate,
        end_date: endDate || undefined,
        flow_intensity: flowIntensity || undefined,
        notes: notes || undefined,
      });
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setFlowIntensity('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to add period');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white [color-scheme:light]"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white [color-scheme:light]"
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
              className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                flowIntensity === 'light'
                  ? 'border-blue-400 bg-blue-100 text-blue-800'
                  : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setFlowIntensity('moderate')}
              className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                flowIntensity === 'moderate'
                  ? 'border-yellow-400 bg-yellow-100 text-yellow-800'
                  : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
              }`}
            >
              Moderate
            </button>
            <button
              type="button"
              onClick={() => setFlowIntensity('heavy')}
              className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                flowIntensity === 'heavy'
                  ? 'border-red-400 bg-red-100 text-red-800'
                  : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
            rows={3}
            placeholder="Any symptoms, observations, or notes..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Saving...' : (editingPeriod ? 'Update Period' : 'Save Period')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
