import { useState, useEffect } from 'react';
import { periodAPI, predictionAPI, authAPI, symptomAPI, Period, Prediction } from './api';
import Login from './components/Login';
import PeriodList from './components/PeriodList';
import PredictionCard from './components/PredictionCard';
import AddPeriodForm from './components/AddPeriodForm';
import SymptomInsights from './components/SymptomInsights';
import CycleProgressBar from './components/CycleProgressBar';
import CalendarHeatmap from './components/CalendarHeatmap';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [calendarData, setCalendarData] = useState<{ predictions: Prediction[]; cycle_stats: any } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPeriodHistory, setShowPeriodHistory] = useState(false);
  const [showSymptomInsights, setShowSymptomInsights] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [periodsData, calendarData] = await Promise.all([
        periodAPI.getAll(),
        predictionAPI.getCalendar(3).catch((err) => {
          console.error('Prediction error:', err);
          return null;
        }), // Prediction might fail if not enough data
      ]);
      console.log('Loaded data:', { periodsData, calendarData });
      setPeriods(periodsData.periods);
      setCalendarData(calendarData);
    
      if (calendarData && calendarData.predictions.length > 0) {
        const firstPrediction = {
          ...calendarData.predictions[0],
          cycle_stats: calendarData.cycle_stats,
        };
        setPrediction(firstPrediction);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (email: string, password: string, isSignup: boolean) => {
    try {
      const response = isSignup 
        ? await authAPI.register(email, password)
        : await authAPI.login(email, password);
      
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      await loadData();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || (isSignup ? 'Registration failed' : 'Login failed'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setPeriods([]);
    setPrediction(null);
  };

  const handleAddPeriod = async (data: {
    start_date: string;
    end_date?: string;
    flow_intensity?: 'light' | 'moderate' | 'heavy';
    notes?: string;
    symptoms?: Array<{
      date: string;
      symptom_type: string;
      severity: number;
      notes?: string;
    }>;
  }) => {
    try {
      let periodId: string;
      
      if (editingPeriod) {
        // Update existing period
        await periodAPI.update(editingPeriod.id, data);
        periodId = editingPeriod.id;
      } else {
        // Create new period
        const result = await periodAPI.create(data);
        periodId = result.data.id;
      }

      // Add symptoms if any (now with proper dates)
      if (data.symptoms && data.symptoms.length > 0 && periodId) {
        await Promise.all(
          data.symptoms.map(symptom =>
            symptomAPI.create(periodId, {
              date: symptom.date,  // Use actual date from symptom
              symptom_type: symptom.symptom_type as any,
              severity: symptom.severity,
              notes: symptom.notes,
            })
          )
        );
      }

      await loadData(); // Reload data after adding/updating
      setShowAddForm(false);
      setEditingPeriod(null);
    } catch (err: any) {
      throw new Error(err.response?.data?.error || `Failed to ${editingPeriod ? 'update' : 'add'} period`);
    }
  };

  const handleEditPeriod = (period: Period) => {
    setEditingPeriod(period);
    setShowAddForm(false); // Close the top form if it's open
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingPeriod(null);
  };

  const handleDeletePeriod = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this period?')) {
      return;
    }
    
    try {
      await periodAPI.delete(id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete period');
    }
  };

  if (!isAuthenticated) {
    return <Login onAuth={handleAuth} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Period Tracker</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            title="Logout"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Cycle Progress Bar */}
        {periods.length > 0 && (
          <CycleProgressBar 
            periods={periods} 
            nextPeriodDate={prediction?.predicted_start_date || null}
          />
        )}

        {/* Prediction Card */}
        {prediction && <PredictionCard prediction={prediction} allPredictions={calendarData?.predictions || []} />}

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) setEditingPeriod(null); // Clear edit state when closing
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            {showAddForm ? 'Cancel' : '+ Log Period'}
          </button>
          
          {periods.length > 0 && (
            <button
              onClick={() => setShowCalendar(true)}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors shadow-md border-2 border-primary-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Calendar
            </button>
          )}
        </div>

        {/* Add/Edit Period Form */}
        {showAddForm && !editingPeriod && (
          <div className="mb-8">
            <AddPeriodForm 
              onSubmit={handleAddPeriod} 
              onCancel={handleCancelEdit}
              editingPeriod={null}
            />
          </div>
        )}

        {/* Period List */}
        <div className="mb-8">
          <button
            onClick={() => setShowPeriodHistory(!showPeriodHistory)}
            className="w-full bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800">Period History ({periods.length})</h2>
            </div>
            <svg 
              className={`w-6 h-6 text-gray-600 transition-transform ${showPeriodHistory ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPeriodHistory && (
            <div className="mt-4">
              <PeriodList 
                periods={periods} 
                onDelete={handleDeletePeriod}
                onEdit={handleEditPeriod}
                editingPeriod={editingPeriod}
                onCancelEdit={handleCancelEdit}
                onSubmitEdit={handleAddPeriod}
              />
            </div>
          )}
        </div>

        {/* Symptom Insights - Moved to Bottom */}
        {periods.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowSymptomInsights(!showSymptomInsights)}
              className="w-full bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-800">Symptom Insights</h2>
              </div>
              <svg 
                className={`w-6 h-6 text-gray-600 transition-transform ${showSymptomInsights ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSymptomInsights && (
              <div className="mt-4">
                <SymptomInsights />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Calendar Modal */}
      {showCalendar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCalendar(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-800">Cycle Calendar</h2>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <CalendarHeatmap periods={periods} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
