import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Calendar, Trophy, Zap, Play, Square, AlertCircle } from 'lucide-react';

const ContestTimer = ({ startDate, endDate, onStatusChange }) => {
  const [timerState, setTimerState] = useState({
    status: 'loading',
    timeLeft: { hours: 0, minutes: 0, seconds: 0 },
    displayContent: 'Loading contest time...',
    progress: 0
  });
  
  const timerIntervalRef = useRef(null);
  const previousStatusRef = useRef('loading');

  const formatTime = useCallback((ms) => {
    if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0 };

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  }, []);

  const calculateProgress = useCallback((start, end, now) => {
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  }, []);

  const updateTimerState = useCallback(() => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const timeToStart = start.getTime() - now.getTime();
    const timeToEnd = end.getTime() - now.getTime();

    if (timeToStart > 0) {
      // Contest is upcoming
      const newState = {
        status: 'upcoming',
        timeLeft: formatTime(timeToStart),
        displayContent: 'Contest Starts In',
        progress: 0
      };
      setTimerState(newState);
      
      // Call status change callback if status changed
      if (previousStatusRef.current !== 'upcoming' && onStatusChange) {
        onStatusChange('upcoming', newState);
      }
      previousStatusRef.current = 'upcoming';
      
    } else if (timeToEnd > 0) {
      // Contest is active
      const progress = calculateProgress(start, end, now);
      const newState = {
        status: 'active',
        timeLeft: formatTime(timeToEnd),
        displayContent: 'Contest Ends In',
        progress
      };
      setTimerState(newState);
      
      if (previousStatusRef.current !== 'active' && onStatusChange) {
        onStatusChange('active', newState);
      }
      previousStatusRef.current = 'active';
      
    } else {
      // Contest has ended
      const newState = {
        status: 'ended',
        timeLeft: { hours: 0, minutes: 0, seconds: 0 },
        displayContent: 'Contest Ended',
        progress: 100
      };
      setTimerState(newState);
      
      if (previousStatusRef.current !== 'ended' && onStatusChange) {
        onStatusChange('ended', newState);
      }
      previousStatusRef.current = 'ended';
    }
  }, [startDate, endDate, formatTime, calculateProgress, onStatusChange]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Validate dates
    if (!startDate || !endDate) {
      setTimerState({
        status: 'error',
        timeLeft: { hours: 0, minutes: 0, seconds: 0 },
        displayContent: 'Invalid contest dates',
        progress: 0
      });
      return;
    }

    timerIntervalRef.current = setInterval(updateTimerState, 1000);
    updateTimerState();

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [updateTimerState]);

  const getStatusConfig = () => {
    switch (timerState.status) {
      case 'upcoming':
        return {
          gradient: 'from-blue-500 via-indigo-600 to-purple-700',
          bgColor: 'from-blue-500/10 via-indigo-500/5 to-purple-500/10',
          borderColor: 'border-blue-400/40',
          textColor: 'text-blue-100',
          icon: <Calendar className="w-6 h-6" />,
          iconBg: 'bg-blue-500/20',
          pulse: '',
          glow: 'shadow-blue-500/30'
        };
      case 'active':
        return {
          gradient: 'from-emerald-500 via-green-600 to-teal-700',
          bgColor: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
          borderColor: 'border-emerald-400/40',
          textColor: 'text-emerald-100',
          icon: <Zap className="w-6 h-6" />,
          iconBg: 'bg-emerald-500/20',
          pulse: '',
          glow: 'shadow-emerald-500/30'
        };
      case 'ended':
        return {
          gradient: 'from-red-500 via-rose-600 to-pink-700',
          bgColor: 'from-red-500/10 via-rose-500/5 to-pink-500/10',
          borderColor: 'border-red-400/40',
          textColor: 'text-red-100',
          icon: <Square className="w-6 h-6" />,
          iconBg: 'bg-red-500/20',
          pulse: '',
          glow: 'shadow-red-500/30'
        };
      case 'error':
        return {
          gradient: 'from-orange-500 via-amber-600 to-yellow-700',
          bgColor: 'from-orange-500/10 via-amber-500/5 to-yellow-500/10',
          borderColor: 'border-orange-400/40',
          textColor: 'text-orange-100',
          icon: <AlertCircle className="w-6 h-6" />,
          iconBg: 'bg-orange-500/20',
          pulse: '',
          glow: 'shadow-orange-500/30'
        };
      default:
        return {
          gradient: 'from-slate-500 via-gray-600 to-slate-700',
          bgColor: 'from-slate-500/10 via-gray-500/5 to-slate-500/10',
          borderColor: 'border-slate-400/40',
          textColor: 'text-slate-100',
          icon: <Clock className="w-6 h-6" />,
          iconBg: 'bg-slate-500/20',
          pulse: '',
          glow: 'shadow-slate-500/30'
        };
    }
  };

  const config = getStatusConfig();

  if (timerState.status === 'error') {
    return (
      <div className={`bg-gradient-to-br ${config.bgColor} backdrop-blur-xl border-2 ${config.borderColor} rounded-3xl p-8 shadow-2xl ${config.glow} max-w-md mx-auto`}>
        <div className="flex items-center justify-center gap-4">
          <div className={`${config.iconBg} p-3 rounded-2xl`}>
            {config.icon}
          </div>
          <div className={`text-xl font-semibold ${config.textColor}`}>
            {timerState.displayContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${config.bgColor} backdrop-blur-xl border-2 ${config.borderColor} rounded-3xl p-8 shadow-2xl ${config.glow} max-w-2xl mx-auto relative overflow-hidden`}>
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-5 rounded-3xl`}></div>
      
      {/* Progress bar for active contests */}
      {timerState.status === 'active' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 rounded-t-3xl overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-1000 ease-out`}
            style={{ width: `${timerState.progress}%` }}
          ></div>
        </div>
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`${config.iconBg} p-4 rounded-2xl shadow-lg backdrop-blur-sm border border-white/10`}>
            {config.icon}
          </div>
          <div className="text-center">
            <h2 className={`text-2xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              {timerState.displayContent}
            </h2>
            {timerState.status === 'active' && (
              <p className="text-sm text-gray-400 mt-1">
                {timerState.progress.toFixed(1)}% Complete
              </p>
            )}
          </div>
        </div>
        
        {/* Time Display */}
        {(timerState.status === 'upcoming' || timerState.status === 'active') && (
          <div className="flex justify-center gap-6">
            {[
              { label: 'Hours', value: timerState.timeLeft.hours, key: 'h' },
              { label: 'Minutes', value: timerState.timeLeft.minutes, key: 'm' },
              { label: 'Seconds', value: timerState.timeLeft.seconds, key: 's' }
            ].map((item, index) => (
              <div key={item.key} className="text-center group">
                <div className={`bg-gradient-to-br ${config.gradient} p-5 rounded-2xl shadow-xl min-w-[90px] transform group-hover:scale-105 transition-all duration-300 border border-white/20 backdrop-blur-sm`}>
                  <div className="text-4xl font-bold text-white drop-shadow-lg font-mono tracking-tight">
                    {item.value.toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-400 mt-3 uppercase tracking-widest">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contest Ended State */}
        {timerState.status === 'ended' && (
          <div className="text-center">
            <div className={`inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${config.gradient} rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm`}>
              <Trophy className="w-6 h-6 text-white" />
              <span className="text-xl font-semibold text-white">
                Contest Completed
              </span>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient}`}></div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {timerState.status === 'upcoming' && 'Upcoming'}
              {timerState.status === 'active' && 'Live Contest'}
              {timerState.status === 'ended' && 'Completed'}
              {timerState.status === 'loading' && 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-l from-white/5 to-transparent rounded-full blur-3xl"></div>
    </div>
  );
};

export default ContestTimer;