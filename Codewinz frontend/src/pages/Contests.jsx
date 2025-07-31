import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, Loader2, Play, Trophy, UserPlus, Users, Target, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import axiosClient from '../../utils/axiosClient';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

// Helper to determine contest status and button text/style
const getContestDisplayInfo = (contest, userId, setContests, navigate) => {
  const now = new Date();
  const start = new Date(contest.startDate);
  const end = new Date(contest.endDate);
  let status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction;

  const isRegistered = contest.registeredUsers?.includes(userId);

  if (now < start) {
    status = 'Upcoming';
    statusColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    if (isRegistered) {
      buttonText = 'Registered';
      buttonIcon = <CheckCircle size={18} />;
      buttonClass = 'bg-emerald-500/80 cursor-not-allowed opacity-70 border-emerald-400/30';
      buttonAction = () => {}; // no-op
    } else {
      buttonText = 'Register';
      buttonIcon = <UserPlus size={18} />;
      buttonClass = 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-emerald-400/30 shadow-emerald-500/20';
      buttonAction = async () => {
        await axiosClient.put(`/contest/register/${contest._id}`);
        const fetchedContests = await axiosClient.get("/contest/getContest")
        setContests(fetchedContests.data.contests);
      };
    }
  } else if (now >= start && now <= end) {
    status = 'Active';
    statusColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    buttonText = 'Start Contest';
    buttonIcon = <Play size={18} />;
    buttonClass = 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 animate-pulse border-blue-400/30 shadow-blue-500/20';
    buttonAction = () => {navigate(`/contest/${contest._id}`)};
  } else {
    status = 'Completed';
    statusColor = 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    buttonText = 'View Results';
    buttonIcon = <Trophy size={18} />;
    buttonClass = 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 border-slate-400/30 shadow-slate-500/20';
    buttonAction = () => {navigate(`/contestResult/${contest._id}`)};
  }

  return { status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction };
};

const Contests = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth)
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadContests = async () => {
      setLoading(true);
      try {
        const fetchedContests = await axiosClient.get("/contest/getContest")
        setContests(fetchedContests.data.contests);
      } catch (error) {
        console.error('Failed to fetch contests:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContests();
  }, []);

  const getFilteredAndSortedContests = () => {
    const categorized = contests.map(contest => {
      const { status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction } = getContestDisplayInfo(contest, user._id, setContests, navigate);
      return { ...contest, displayStatus: status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction };
    });

    let filtered = categorized;
    if (filter !== 'all') {
      filtered = categorized.filter(contest => contest.displayStatus.toLowerCase() === filter);
    }

    return filtered.sort((a, b) => {
      const order = { 'Active': 1, 'Upcoming': 2, 'Completed': 3 };
      return order[a.displayStatus] - order[b.displayStatus];
    });
  };

  const displayContests = getFilteredAndSortedContests();

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'shortOffset'
    });
  };

  const getFilterStats = () => {
    const stats = contests.reduce((acc, contest) => {
      const { status } = getContestDisplayInfo(contest, user._id, setContests, navigate);
      acc[status.toLowerCase()] = (acc[status.toLowerCase()] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const stats = getFilterStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <Navbar />
      
      {/* Hero Values Section */}
      <section className="py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
           
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-purple-400 mb-4">Innovation</h3>
                <p className="text-slate-300 leading-relaxed">
                  Pushing the boundaries of what's possible in competitive programming with cutting-edge problems and features.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-4">Community</h3>
                <p className="text-slate-300 leading-relaxed">
                  Fostering a supportive and engaging environment where coders connect, learn, and grow together.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-amber-400 mb-4">Excellence</h3>
                <p className="text-slate-300 leading-relaxed">
                  Striving for the highest standards in problem quality, platform performance, and user experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contests Section */}
      <section className="py-12 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Contest Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 text-center backdrop-blur-xl">
              <div className="text-2xl font-bold text-blue-400 mb-1">{stats.total || 0}</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Total</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 text-center backdrop-blur-xl">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{stats.active || 0}</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Active</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center backdrop-blur-xl">
              <div className="text-2xl font-bold text-amber-400 mb-1">{stats.upcoming || 0}</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Upcoming</div>
            </div>
            <div className="bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-slate-500/20 rounded-xl p-4 text-center backdrop-blur-xl">
              <div className="text-2xl font-bold text-slate-400 mb-1">{stats.completed || 0}</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Completed</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['all', 'active', 'upcoming', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden
                  ${filter === status
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-700/50 backdrop-blur-xl'
                  }`}
              >
                <span className="relative z-10">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                {filter === status && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                )}
              </button>
            ))}
          </div>

          {/* Contests List */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="relative inline-block">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin animation-delay-150"></div>
                </div>
                <p className="text-xl text-slate-400 mt-6">Loading contests...</p>
              </div>
            ) : displayContests.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No contests found</h3>
                <p className="text-slate-500">No contests match your current filter selection.</p>
              </div>
            ) : (
              displayContests.map(contest => (
                <div
                  key={contest._id}
                  className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Background Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl"></div>
                  </div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-200 mb-2">
                          {contest.title}
                        </h3>
                        <p className="text-slate-300 text-lg leading-relaxed">
                          {contest.description}
                        </p>
                      </div>
                      <span className={`ml-6 px-4 py-2 rounded-xl border font-medium text-sm ${contest.statusColor}`}>
                        {contest.displayStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <CalendarDays size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-500 uppercase tracking-wide">Starts</div>
                          <div className="text-white font-medium">{formatDate(contest.startDate)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <Clock size={20} className="text-amber-400" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-500 uppercase tracking-wide">Ends</div>
                          <div className="text-white font-medium">{formatDate(contest.endDate)}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={contest.buttonAction}
                      className={`w-full md:w-auto px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 border shadow-lg
                        ${contest.buttonClass} text-white`}
                    >
                      {contest.buttonIcon} {contest.buttonText}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-12 px-4 md:px-8 lg:px-16 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-lg font-semibold text-slate-300 mb-3">
            &copy; {new Date().getFullYear()} CodeWinz. All rights reserved.
          </p>
          <p className="text-slate-400 mb-6">
            Empowering the next generation of coders through challenge and collaboration.
          </p>
          <div className="flex justify-center space-x-8 text-slate-400">
            <a href="#" className="hover:text-blue-400 transition-colors duration-200 hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors duration-200 hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors duration-200 hover:underline">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contests;