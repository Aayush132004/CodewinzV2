import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../utils/axiosClient';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip, // Renamed to avoid conflict with custom Tooltip
  Legend,
} from 'recharts';
import dayjs from 'dayjs'; // For date manipulation for heatmap
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekday);
dayjs.extend(weekOfYear);

// Custom Tooltip Component
const CustomTooltip = ({ content, position, visible }) => {
  if (!visible || !content) return null;
  return (
    <div
      className="fixed bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50"
      style={{
        left: position.x + 10, // Offset from cursor
        top: position.y + 10,
      }}
    >
      {content}
    </div>
  );
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for custom heatmap tooltip
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const response = await axiosClient.get("/user/profile");
        const {
          name,
          email,
          profile,
          questionsSolved,
          totalQuestions,
          loginStreak,
          heatmap,
          topics
        } = response.data;
        
        // Convert heatmap Map/Object to array format
        const heatmapArray = Object.entries(heatmap || {}).map(([date, count]) => ({
          date,
          count
        }));
        
        // Convert topics Map/Object to array format for the chart
        const topicsArray = Object.entries(topics || {}).map(([name, solved]) => ({
          name,
          solved
        }));

        setUser({ 
          name, 
          email, 
          profile, 
          questionsSolved, 
          totalQuestions,
          loginStreak,
          heatmap: heatmapArray,
          topics: topicsArray
        });

      } catch (err) {
        console.error("Error fetching user data:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, []);

  // Function to get heatmap color intensity
  const getHeatmapColor = (count) => {
    if (!count || count === 0) return 'bg-gray-800';
    if (count < 3) return 'bg-green-900';
    if (count < 6) return 'bg-green-700';
    if (count < 9) return 'bg-green-500';
    return 'bg-green-400';
  };

  // Prepare data for heatmap grid display
  const prepareHeatmapGrid = () => {
    const weeks = [];
    const today = dayjs();
    const startDate = today.subtract(1, 'year').startOf('week');
    
    // Convert heatmap to object for easy lookup
    const heatmapObj = (user?.heatmap || []).reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    // Create 53 weeks (52 weeks + current week)
    for (let week = 0; week < 53; week++) {
      const weekStart = startDate.add(week, 'week');
      const weekDays = [];
      
      // Create 7 days for each week (Sun-Sat)
      for (let day = 0; day < 7; day++) {
        const currentDate = weekStart.add(day, 'day');
        const dateStr = currentDate.format('YYYY-MM-DD');
        const count = heatmapObj[dateStr] || 0;
        
        weekDays.push({
          date: currentDate,
          count,
          isFuture: currentDate.isAfter(today, 'day'),
        });
      }
      
      weeks.push(weekDays);
    }
    
    return weeks;
  };

  const heatmapWeeks = prepareHeatmapGrid();
  const monthLabels = [];
  let lastMonth = null;

  // Generate month labels for heatmap
  for (let week = 0; week < heatmapWeeks.length; week++) {
    const firstDay = heatmapWeeks[week][0].date;
    const month = firstDay.month();
    
    // Only add month label if it's a new month and the first day of the week is Sunday
    // This helps align month labels with the grid
    if (month !== lastMonth && firstDay.weekday() === 0) { // Check if it's Sunday (0)
      monthLabels.push({
        weekIndex: week,
        monthName: firstDay.format('MMM'),
      });
      lastMonth = month;
    }
  }

  // Heatmap tooltip event handlers
  const handleMouseEnterHeatmap = (e, count, date, isFuture) => {
    if (isFuture) { // Don't show tooltip for future dates
      setTooltipContent('');
      setShowTooltip(false);
      return;
    }
    setTooltipContent(`${count} submissions on ${date.format('MMM D, YYYY')}`);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    setShowTooltip(true);
  };

  const handleMouseLeaveHeatmap = () => {
    setShowTooltip(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] flex items-center justify-center text-red-400 text-lg">
        Failed to load user profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-gray-100 flex flex-col items-center p-6 sm:p-10">
      {/* Profile Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col sm:flex-row items-center justify-center gap-8 border border-gray-700/50"
      >
        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-purple-500 shadow-xl flex-shrink-0">
          <img 
            src={user.profile || "https://placehold.co/150x150/2d3748/e2e8f0?text=Profile"} 
            alt="Profile" 
            className="w-full h-full object-cover" 
            onError={(e) => e.target.src = "https://placehold.co/150x150/2d3748/e2e8f0?text=Profile"}
          />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-extrabold text-white leading-tight">{user.name}</h1>
          <p className="text-md text-gray-400 mt-1">{user.email}</p>
          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
            <div className="badge badge-lg bg-blue-600 text-white border-blue-700 shadow-md">
              <span className="font-semibold">{user.questionsSolved}</span> Solved
            </div>
            <div className="badge badge-lg bg-purple-600 text-white border-purple-700 shadow-md">
              <span className="font-semibold">{user.loginStreak}</span> Day Streak 🔥
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full max-w-4xl">
        {/* Questions Solved Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card bg-gray-800 rounded-2xl shadow-xl border border-gray-700/50"
        >
          <div className="card-body p-6">
            <h2 className="text-lg font-semibold text-purple-400 mb-2">Total Questions Solved</h2>
            <AnimatePresence mode="wait">
              <motion.h1
                key={user.questionsSolved}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-5xl font-extrabold text-green-400"
              >
                {user.questionsSolved}
              </motion.h1>
            </AnimatePresence>
            <p className="text-gray-400 mt-2">Out of {user.totalQuestions} available problems.</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: `${(user.questionsSolved / user.totalQuestions) * 100 || 0}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Login Streak Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card bg-gray-800 rounded-2xl shadow-xl border border-gray-700/50"
        >
          <div className="card-body p-6">
            <h2 className="text-lg font-semibold text-blue-400 mb-2">Current Login Streak</h2>
            <motion.h1
              key={user.loginStreak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="text-5xl font-extrabold text-orange-400"
            >
              {user.loginStreak} <span className="text-3xl">days</span>
            </motion.h1>
            <p className="text-gray-400 mt-2">Keep up the great work!</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
              <div
                className="bg-orange-500 h-2.5 rounded-full"
                style={{ width: `${Math.min(100, user.loginStreak / 7 * 100)}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Submission Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-xl p-6 mt-10 border border-gray-700/50"
      >
        <h2 className="text-lg font-semibold text-green-400 mb-4">Submission Activity (Last 12 Months)</h2>
        <div className="flex items-start gap-1">
          {/* Day labels (vertical) */}
          <div className="flex flex-col gap-1 mt-6">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => (
              <div key={i} className="h-4 flex items-center justify-end pr-2">
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Main heatmap grid */}
          <div className="flex-1 overflow-x-auto custom-scrollbar-horizontal pb-2">
            <div className="flex gap-1">
              {heatmapWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1 relative">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-4 h-4 rounded-sm transition-colors duration-200 cursor-pointer ${
                        day.isFuture ? 'bg-gray-900' : getHeatmapColor(day.count)
                      }`}
                      onMouseEnter={(e) => handleMouseEnterHeatmap(e, day.count, day.date, day.isFuture)}
                      onMouseLeave={handleMouseLeaveHeatmap}
                    />
                  ))}
                  
                  {/* Month labels */}
                  {monthLabels.some(ml => ml.weekIndex === weekIndex) && (
                    <div className="absolute -top-5 left-0 text-xs text-gray-400 whitespace-nowrap">
                      {monthLabels.find(ml => ml.weekIndex === weekIndex)?.monthName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-4">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm bg-gray-800"></div>
            <div className="w-4 h-4 rounded-sm bg-green-900"></div>
            <div className="w-4 h-4 rounded-sm bg-green-700"></div>
            <div className="w-4 h-4 rounded-sm bg-green-500"></div>
            <div className="w-4 h-4 rounded-sm bg-green-400"></div>
          </div>
          <span>More</span>
        </div>
      </motion.div>

      {/* Topic-wise Problems Solved Graph */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-xl p-6 mt-10 border border-gray-700/50"
      >
        <h2 className="text-lg font-semibold text-blue-400 mb-4">Problems Solved by Topic</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={user.topics}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="name" stroke="#cbd5e0" tick={{ fill: '#a0aec0', fontSize: 12 }} />
            <YAxis stroke="#cbd5e0" tick={{ fill: '#a0aec0', fontSize: 12 }} />
            <RechartsTooltip // Using RechartsTooltip here
              cursor={{ fill: 'rgba(255,255,255,0.1)' }}
              contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', color: '#a0aec0' }} />
            <Bar dataKey="solved" fill="#8884d8" name="Solved Problems" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Placeholder for other sections or action buttons */}
      <div className="mt-10 text-gray-400 text-center">
        {/* You can add more sections here like recent activity, badges, etc. */}
      </div>

      {/* Render the custom tooltip */}
      <CustomTooltip content={tooltipContent} position={tooltipPosition} visible={showTooltip} />
    </div>
  );
};

export default Profile;
