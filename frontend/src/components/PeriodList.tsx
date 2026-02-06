import { Period, Symptom } from '../api';
import AddPeriodForm from './AddPeriodForm';

interface PeriodListProps {
  periods: Period[];
  onDelete: (id: string) => void;
  onEdit: (period: Period) => void;
  editingPeriod: Period | null;
  onCancelEdit: () => void;
  onSubmitEdit: (data: any) => Promise<void>;
}

interface PeriodWithSymptoms extends Period {
  symptoms?: Symptom[];
}

export default function PeriodList({ periods, onDelete, onEdit, editingPeriod, onCancelEdit, onSubmitEdit }: PeriodListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFlowColor = (intensity: string | null) => {
    switch (intensity) {
      case 'light':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'heavy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatSymptomType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'Ongoing';
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (periods.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No periods logged yet</h3>
        <p className="text-gray-500">Start tracking your cycle by logging your first period above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Period History</h2>
      
      <div className="space-y-3">
        {periods.map((period) => (
          <div key={period.id}>
            {/* Period Card */}
            <div
              className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Start Date</p>
                      <p className="text-base font-semibold text-gray-800">
                        {formatDate(period.start_date)}
                      </p>
                    </div>
                    
                    {period.end_date && (
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">End Date</p>
                        <p className="text-base font-semibold text-gray-800">
                          {formatDate(period.end_date)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="text-base font-semibold text-gray-800">
                        {calculateDuration(period.start_date, period.end_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {period.flow_intensity && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getFlowColor(period.flow_intensity)}`}>
                        {period.flow_intensity} flow
                      </span>
                    )}
                    
                    {period.notes && (
                      <span className="text-xs text-gray-600 italic">
                        "{period.notes}"
                      </span>
                    )}
                  </div>

                  {/* Show Symptoms if available */}
                  {(period as PeriodWithSymptoms).symptoms && (period as PeriodWithSymptoms).symptoms!.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">Symptoms:</p>
                      <div className="flex flex-wrap gap-2">
                        {(period as PeriodWithSymptoms).symptoms!.map((symptom) => (
                          <span
                            key={symptom.id}
                            className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200"
                            title={symptom.notes || ''}
                          >
                            <span>{getSymptomIcon(symptom.symptom_type)}</span>
                            <span>{formatSymptomType(symptom.symptom_type)}</span>
                            <span className="font-semibold">({symptom.severity}/5)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onEdit(period)}
                    className="text-blue-500 hover:text-blue-700 transition-colors p-2"
                    title="Edit period"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(period.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2"
                    title="Delete period"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Form - appears right below the period being edited */}
            {editingPeriod?.id === period.id && (
              <div className="mt-4 mb-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-400 shadow-xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-blue-400">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <h3 className="text-lg font-bold text-blue-900">Edit Period</h3>
                </div>
                <AddPeriodForm 
                  onSubmit={onSubmitEdit}
                  onCancel={onCancelEdit}
                  editingPeriod={editingPeriod}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
