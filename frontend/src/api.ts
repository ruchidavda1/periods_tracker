import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_BACKEND_API_URL 
  ? `${import.meta.env.VITE_BACKEND_API_URL}/api`
  : 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
};

// Period API
export interface Period {
  id: string;
  start_date: string;
  end_date: string | null;
  flow_intensity: 'light' | 'moderate' | 'heavy' | null;
  notes: string | null;
  created_at: string;
}

export const periodAPI = {
  getAll: async (): Promise<{ periods: Period[] }> => {
    const response = await api.get('/periods');
    return response.data.data;
  },
  
  create: async (data: {
    start_date: string;
    end_date?: string;
    flow_intensity?: 'light' | 'moderate' | 'heavy';
    notes?: string;
  }) => {
    const response = await api.post('/periods', data);
    return response.data;
  },
  
  update: async (id: string, data: {
    start_date?: string;
    end_date?: string;
    flow_intensity?: 'light' | 'moderate' | 'heavy';
    notes?: string;
  }) => {
    const response = await api.put(`/periods/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/periods/${id}`);
    return response.data;
  },
};

// Prediction API - Unified Interface
export interface Prediction {
  // Cycle identification (only in calendar view)
  cycle_number?: number;
  
  // Period prediction
  predicted_start_date: string;
  predicted_end_date: string;
  confidence_score: number;
  predicted_flow_intensity: 'light' | 'moderate' | 'heavy' | null;
  
  // Ovulation prediction
  ovulation_start: string;
  ovulation_end: string;
  
  // Statistics (only in single prediction view)
  cycle_stats?: {
    avg_cycle_length: number;
    avg_period_length: number;
    cycle_regularity: string;
    cycle_variation: string;
    cycles_tracked: number;
    standard_deviation: string;
  };
}


export const predictionAPI = {
  getNextPeriod: async (): Promise<Prediction> => {
    const response = await api.get('/predictions/next-period');
    const data = response.data.data;
    
    // Check if data is in the nested format (legacy backend response)
    if (data && data.next_period) {
      // Transform nested backend format to flat unified format
      return {
        predicted_start_date: data.next_period.predicted_start_date,
        predicted_end_date: data.next_period.predicted_end_date,
        confidence_score: data.next_period.confidence_score,
        predicted_flow_intensity: data.next_period.predicted_flow_intensity,
        ovulation_start: data.ovulation.predicted_start_date,
        ovulation_end: data.ovulation.predicted_end_date,
        cycle_stats: data.cycle_stats,
      };
    }
    
    return data;
  },
  
  getCalendar: async (months: number = 3): Promise<{ predictions: Prediction[]; cycle_stats: Prediction['cycle_stats'] }> => {
    const response = await api.get(`/predictions/calendar?months=${months}`);
    return response.data.data;
  },
};

// Symptom API
export type SymptomType = 'cramps' | 'headache' | 'mood_swings' | 'fatigue' | 'bloating' | 'acne' | 'other';

export interface Symptom {
  id: string;
  period_id: string;
  date: string;
  symptom_type: SymptomType;
  severity: number;
  notes: string | null;
}

export interface SymptomPattern {
  symptom_type: string;
  frequency: number;
  avg_severity: number;
  occurrences: number;
}

export const symptomAPI = {
  create: async (periodId: string, data: {
    date: string;
    symptom_type: SymptomType;
    severity: number;
    notes?: string;
  }) => {
    const response = await api.post(`/periods/${periodId}/symptoms`, data);
    return response.data;
  },

  getByPeriod: async (periodId: string): Promise<Symptom[]> => {
    const response = await api.get(`/periods/${periodId}/symptoms`);
    return response.data.data;
  },

  getPatterns: async (): Promise<{ patterns: SymptomPattern[]; total_periods: number }> => {
    const response = await api.get('/symptoms/patterns');
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/symptoms/${id}`);
    return response.data;
  },
};

export default api;
