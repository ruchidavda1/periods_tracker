import { useState } from 'react';
import { Period, Symptom } from '../api';

interface CalendarHeatmapProps {
  periods: Period[];
}

interface PeriodWithSymptoms extends Period {
  symptoms?: Symptom[];
}

export default function CalendarHeatmap({ periods }: CalendarHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Check if a date is a period day
  const isPeriodDay = (day: number) => {
    const checkDate = new Date(year, month, day);
    checkDate.setHours(0, 0, 0, 0);
    
    return periods.some(period => {
      const startDate = new Date(period.start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = period.end_date ? new Date(period.end_date) : startDate;
      endDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() >= startDate.getTime() && checkDate.getTime() <= endDate.getTime();
    });
  };

  // Check if a date is in fertile window (estimated)
  const isFertileDay = (day: number) => {
    const checkDate = new Date(year, month, day);
    return periods.some(period => {
      const startDate = new Date(period.start_date);
      const fertileStart = new Date(startDate);
      fertileStart.setDate(fertileStart.getDate() + 12); // Day 12-16 of cycle
      const fertileEnd = new Date(fertileStart);
      fertileEnd.setDate(fertileEnd.getDate() + 4);
      return checkDate >= fertileStart && checkDate <= fertileEnd;
    });
  };

  // Get symptoms for a specific date
  const getSymptomsForDate = (day: number): string[] => {
    const checkDate = new Date(year, month, day);
    // Create date string in local timezone to avoid timezone shift
    const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    
    const symptoms: string[] = [];
    (periods as PeriodWithSymptoms[]).forEach(period => {
      if (period.symptoms) {
        period.symptoms.forEach(symptom => {
          if (symptom.date === dateString) {
            symptoms.push(getSymptomIcon(symptom.symptom_type));
          }
        });
      }
    });
    
    return symptoms;
  };

  const getSymptomIcon = (symptomType: string) => {
    const icons: { [key: string]: string } = {
      'cramps': '🩹',
      'headache': '🤕',
      'mood_swings': '😢',
      'fatigue': '😴',
      'bloating': '🎈',
      'acne': '🔴',
      'other': '📝',
    };
    return icons[symptomType] || '📝';
  };

  const getDayColor = (day: number) => {
    if (isPeriodDay(day)) {
      return 'bg-red-400 text-white font-bold hover:bg-red-500';
    }
    if (isFertileDay(day)) {
      return 'bg-purple-300 text-white font-semibold hover:bg-purple-400';
    }
    return 'bg-gray-50 text-gray-700 hover:bg-gray-100';
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[110px] text-center">
            {monthName}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-center text-[10px] font-semibold text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - always 6 rows (42 cells) for consistent size */}
      <div className="grid grid-cols-7 gap-1">
        {/* Render all 42 cells (6 weeks) */}
        {Array.from({ length: 42 }).map((_, index) => {
          const dayNumber = index - startDayOfWeek + 1;
          const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
          
          if (!isValidDay) {
            // Empty cell
            return <div key={`empty-${index}`} className="w-9 h-9"></div>;
          }
          
          return (
            <div
              key={dayNumber}
              className={`w-9 h-9 flex flex-col items-center justify-center rounded text-xs font-medium transition-all cursor-pointer ${getDayColor(dayNumber)} ${
                isToday(dayNumber) ? 'ring-2 ring-primary-500' : ''
              }`}
              title={
                isPeriodDay(dayNumber) ? 'Period Day' :
                isFertileDay(dayNumber) ? 'Fertile Window' :
                ''
              }
            >
              <span className="text-[10px]">{dayNumber}</span>
              {getSymptomsForDate(dayNumber).length > 0 && (
                <span className="text-[8px] leading-none">
                  {getSymptomsForDate(dayNumber).slice(0, 2).join('')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-400 rounded"></div>
          <span className="text-xs text-gray-600">Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-purple-300 rounded"></div>
          <span className="text-xs text-gray-600">Fertile</span>
        </div>
      </div>

      {/* Symptoms Legend */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center mb-2">Symptoms</p>
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          <div className="flex items-center gap-1">
            <span>🩹</span>
            <span className="text-gray-600">Cramps</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🤕</span>
            <span className="text-gray-600">Headache</span>
          </div>
          <div className="flex items-center gap-1">
            <span>😢</span>
            <span className="text-gray-600">Mood Swings</span>
          </div>
          <div className="flex items-center gap-1">
            <span>😴</span>
            <span className="text-gray-600">Fatigue</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🎈</span>
            <span className="text-gray-600">Bloating</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔴</span>
            <span className="text-gray-600">Acne</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📝</span>
            <span className="text-gray-600">Other</span>
          </div>
        </div>
      </div>
    </div>
  );
}
