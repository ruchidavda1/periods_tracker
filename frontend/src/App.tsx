import { useState, useEffect } from 'react';
import { periodAPI, predictionAPI, authAPI, Period, Prediction } from './api';
import Login from './components/Login';
import PeriodList from './components/PeriodList';
import PredictionCard from './components/PredictionCard';
import AddPeriodForm from './components/AddPeriodForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const [periodsData, predictionData] = await Promise.all([
        periodAPI.getAll(),
        predictionAPI.getNextPeriod().catch(() => null), // Prediction might fail if not enough data
      ]);
      setPeriods(periodsData.periods);
      setPrediction(predictionData);
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
  }) => {
    try {
      if (editingPeriod) {
        // Update existing period
        await periodAPI.update(editingPeriod.id, data);
      } else {
        // Create new period
        await periodAPI.create(data);
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
    setShowAddForm(true);
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

        {/* Prediction Card */}
        {prediction && <PredictionCard prediction={prediction} />}

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) setEditingPeriod(null); // Clear edit state when closing
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            {showAddForm ? 'Cancel' : '+ Log Period'}
          </button>
        </div>

        {/* Add/Edit Period Form */}
        {showAddForm && (
          <div className="mb-8">
            <AddPeriodForm 
              onSubmit={handleAddPeriod} 
              onCancel={handleCancelEdit}
              editingPeriod={editingPeriod}
            />
          </div>
        )}

        {/* Period List */}
        <PeriodList 
          periods={periods} 
          onDelete={handleDeletePeriod}
          onEdit={handleEditPeriod}
        />
      </main>
    </div>
  );
}

export default App;
