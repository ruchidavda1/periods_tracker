import { Period } from '../api';

interface CycleProgressBarProps {
  periods: Period[];
  nextPeriodDate: string | null;
}

export default function CycleProgressBar({ periods, nextPeriodDate }: CycleProgressBarProps) {
  if (periods.length === 0) return null;

  const lastPeriod = periods[0];
  const today = new Date();
  const lastPeriodDate = new Date(lastPeriod.start_date);
  
  // Calculate days since last period
  const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate days until next period
  const daysUntilNextPeriod = nextPeriodDate 
    ? Math.ceil((new Date(nextPeriodDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Calculate actual cycle length from your data
  const actualCycleLength = daysUntilNextPeriod 
    ? daysSinceLastPeriod + daysUntilNextPeriod 
    : 28; // fallback to 28 if no prediction
  
  // Calculate progress percentage
  const progressPercentage = Math.min((daysSinceLastPeriod / actualCycleLength) * 100, 100);
  
  // Determine cycle phase based on ACTUAL cycle length
  // Ovulation typically occurs 14 days BEFORE next period (not on a fixed day number)
  const getCyclePhase = (daysSince: number, cycleLength: number) => {
    const avgPeriodLength = lastPeriod.end_date 
      ? Math.ceil((new Date(lastPeriod.end_date).getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24))
      : 5;
    
    // Menstrual phase: during period
    if (daysSince <= avgPeriodLength) {
      return { 
        phase: 'Menstrual', 
        color: 'from-red-400 to-pink-400', 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        range: `Days 1-${avgPeriodLength}`
      };
    }
    
    // Ovulation typically occurs 14 days before next period
    const ovulationDay = cycleLength - 14;
    const ovulationWindowStart = ovulationDay - 2;
    const ovulationWindowEnd = ovulationDay + 1;
    
    // Ovulation phase: 3-4 days around ovulation
    if (daysSince >= ovulationWindowStart && daysSince <= ovulationWindowEnd) {
      return { 
        phase: 'Ovulation', 
        color: 'from-purple-400 to-pink-400', 
        bg: 'bg-purple-50', 
        text: 'text-purple-700',
        range: `Days ${ovulationWindowStart}-${ovulationWindowEnd}`
      };
    }
    
    // Follicular phase: after period, before ovulation
    if (daysSince < ovulationWindowStart) {
      return { 
        phase: 'Follicular', 
        color: 'from-blue-400 to-cyan-400', 
        bg: 'bg-blue-50', 
        text: 'text-blue-700',
        range: `Days ${avgPeriodLength + 1}-${ovulationWindowStart - 1}`
      };
    }
    
    // Luteal phase: after ovulation, before next period
    return { 
      phase: 'Luteal', 
      color: 'from-yellow-400 to-orange-400', 
      bg: 'bg-yellow-50', 
      text: 'text-yellow-700',
      range: `Days ${ovulationWindowEnd + 1}-${cycleLength}`
    };
  };
  
  const phaseInfo = getCyclePhase(daysSinceLastPeriod, actualCycleLength);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Your Cycle Today</h2>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${phaseInfo.bg} ${phaseInfo.text}`}>
          {phaseInfo.phase} Phase
        </span>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Day <span className="font-bold text-gray-900">{daysSinceLastPeriod}</span> of cycle
            </span>
            <span className="text-sm text-gray-600">
              {daysUntilNextPeriod !== null && daysUntilNextPeriod > 0 ? (
                <>
                  <span className="font-bold text-gray-900">{daysUntilNextPeriod}</span> days until next period
                </>
              ) : daysUntilNextPeriod === 0 ? (
                <span className="font-bold text-red-600">Period expected today</span>
              ) : (
                <span className="text-gray-500">Calculating...</span>
              )}
            </span>
          </div>
          
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${phaseInfo.color} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Cycle Phases Visualization */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className={`p-3 rounded-lg text-center transition-all ${phaseInfo.phase === 'Menstrual' ? 'bg-red-100 border-2 border-red-400 scale-105' : 'bg-gray-50'}`}>
            <div className="text-2xl mb-1">🩸</div>
            <p className="text-xs font-semibold text-gray-700">Menstrual</p>
            <p className="text-xs text-gray-500">{phaseInfo.phase === 'Menstrual' ? phaseInfo.range : 'Days 1-5'}</p>
          </div>
          
          <div className={`p-3 rounded-lg text-center transition-all ${phaseInfo.phase === 'Follicular' ? 'bg-blue-100 border-2 border-blue-400 scale-105' : 'bg-gray-50'}`}>
            <div className="text-2xl mb-1">🌱</div>
            <p className="text-xs font-semibold text-gray-700">Follicular</p>
            <p className="text-xs text-gray-500">{phaseInfo.phase === 'Follicular' ? phaseInfo.range : 'After period'}</p>
          </div>
          
          <div className={`p-3 rounded-lg text-center transition-all ${phaseInfo.phase === 'Ovulation' ? 'bg-purple-100 border-2 border-purple-400 scale-105' : 'bg-gray-50'}`}>
            <div className="text-2xl mb-1">🌸</div>
            <p className="text-xs font-semibold text-gray-700">Ovulation</p>
            <p className="text-xs text-gray-500">{phaseInfo.phase === 'Ovulation' ? phaseInfo.range : 'Mid-cycle'}</p>
          </div>
          
          <div className={`p-3 rounded-lg text-center transition-all ${phaseInfo.phase === 'Luteal' ? 'bg-yellow-100 border-2 border-yellow-400 scale-105' : 'bg-gray-50'}`}>
            <div className="text-2xl mb-1">🌙</div>
            <p className="text-xs font-semibold text-gray-700">Luteal</p>
            <p className="text-xs text-gray-500">{phaseInfo.phase === 'Luteal' ? phaseInfo.range : 'Pre-period'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
