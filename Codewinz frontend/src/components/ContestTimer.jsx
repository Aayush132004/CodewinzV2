import React, { useState, useEffect, useRef, useCallback } from 'react';

// Helper function to format milliseconds into HH:MM:SS
const formatTime = (ms) => {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const ContestTimer = ({ startDate, endDate }) => {
  const [timerState, setTimerState] = useState({
    status: 'loading', // 'upcoming', 'active', 'ended'
    displayContent: 'Loading contest time...',
  });
  const timerIntervalRef = useRef(null);

  const updateTimerState = useCallback(() => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const timeToStart = start.getTime() - now.getTime();
    const timeToEnd = end.getTime() - now.getTime();

    if (timeToStart > 0) {
      // Contest is upcoming
      setTimerState({
        status: 'upcoming',
        displayContent: 'Contest has not started yet.',
      });
    } else if (timeToEnd > 0) {
      // Contest is active - show countdown
      setTimerState({
        status: 'active',
        displayContent: `Contest ends in: ${formatTime(timeToEnd)}`,
      });
    } else {
      // Contest has ended
      setTimerState(prevState => {
        const newState = {
          status: 'ended',
          displayContent: 'Contest has ended.',
        };
        // No onContestEnd callback here as per the simplified request
        return newState;
      });
    }
  }, [startDate, endDate]); // Removed onContestEnd from dependencies as it's not used in this version

  useEffect(() => {
    // Clear any existing interval on re-render or unmount
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Set up the interval to update every second
    timerIntervalRef.current = setInterval(updateTimerState, 1000);

    // Initial call to set the state immediately
    updateTimerState();

    // Cleanup function: Clear the interval when the component unmounts
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [updateTimerState]); // Dependency on updateTimerState to re-run effect if it changes

  // Determine Tailwind/DaisyUI classes based on timer status
  const containerClasses = `
    font-mono text-lg font-semibold p-3 rounded-lg shadow-lg flex items-center justify-center
    bg-white text-gray-800 border-2 
    min-w-[250px] transition-all duration-300 ease-in-out
    ${timerState.status === 'active' ? 'border-green-500' : ''}
    ${timerState.status === 'upcoming' ? 'border-blue-500' : ''}
    ${timerState.status === 'ended' ? 'border-red-500' : ''}
    ${timerState.status === 'loading' ? 'border-gray-400 animate-pulse' : ''}
  `;

  return (
    <div className={containerClasses}>
      <span>{timerState.displayContent}</span>
    </div>
  );
};

export default ContestTimer;