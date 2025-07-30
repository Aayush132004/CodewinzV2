import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Trophy, CheckCircle, Hash, Award, Code, ChevronRight, Users, TrendingUp, TrendingDown, Info } from 'lucide-react'; // Added Info icon
import axiosClient from "../../utils/axiosClient";

// Chart.js imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- Helper Component: ProblemCard ---
// Displays an individual problem with its status and score, with interactive styling.
const ProblemCard = ({ problem, contestId}) => {
  const navigate = useNavigate();

  // Helper to determine problem max score (must match backend's logic for consistency)
  const getProblemMaxScore = (difficulty) => {
    if (difficulty === "hard") return 100;
    if (difficulty === "easy") return 20;
    if (difficulty === "medium") return 50;
    return 0;
  };

  const problemMaxScore = getProblemMaxScore(problem.difficulty);
  const userScore = problem.userScore || 0; // User's score is directly on the problem object
  const isFullySolved = userScore > 0 && userScore === problemMaxScore;
//  console.log(problem,contestId)
  const handleClick = () => {
    navigate(`/contestStats/${contestId}/${problem._id}`);
  };

  // Determine border and text colors based on user's score for the problem
  const scoreBorderClass = userScore === 0 ? 'border-red-600' : 'border-green-600';
  const scoreTextColorClass = userScore === 0 ? 'text-red-400' : 'text-green-400';

  const difficultyTextColorClass = {
    'easy': 'text-green-300',
    'medium': 'text-yellow-300',
    'hard': 'text-red-300',
  };

  return (
    <div
      onClick={handleClick}
      className={`relative card w-full bg-gray-900/60 border ${scoreBorderClass} rounded-lg shadow-xl
                 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer mb-4
                 overflow-hidden group`} // Added group for advanced hover effects
    >
      {/* Subtle overlay for hover effect */}
      <div className="absolute inset-0 bg-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <div className="card-body p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex-grow text-center sm:text-left">
          <h3 className="card-title text-xl font-bold text-gray-100 mb-1 flex items-center">
            <Code className="inline-block mr-2 text-blue-400" size={20} />
            {problem.title}
          </h3>
          <p className={`text-sm font-medium ${difficultyTextColorClass[problem.difficulty]}`}>
            Difficulty: {problem.difficulty.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-lg font-semibold text-gray-300">
            <Award className="inline-block mr-2 text-purple-400" size={20} />
            Score: <span className={scoreTextColorClass} style={{ marginLeft: '0.25rem' }}>
              {userScore}
            </span> / {problemMaxScore}
          </div>
          {isFullySolved && (
            <div className="badge badge-success gap-2 py-2 px-3 text-sm font-semibold bg-green-700 text-white border-none shadow-md">
              <CheckCircle size={16} /> Solved
            </div>
          )}
          <ChevronRight className="text-gray-400 group-hover:text-blue-400 transition-colors" size={24} />
        </div>
      </div>
    </div>
  );
};

// --- Main Component: ContestResult ---
const ContestResult = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();

  const [contestResult, setContestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get(`/contest/contestResult/${contestId}`);
        setContestResult(response.data);
      } catch (err) {
        console.error("Error fetching contest results:", err);
        setError(err.response?.data?.message || "Failed to load contest results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [contestId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-white">
        <span className="loading loading-spinner loading-lg text-blue-400"></span>
        <p className="mt-4 text-xl text-blue-300">Summoning the results from the void...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-white p-6">
        <div className="alert alert-error shadow-lg max-w-md text-center bg-red-800 text-white border-red-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
        <button onClick={() => window.location.reload()} className="btn btn-primary mt-6 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg">Retry Operation</button>
      </div>
    );
  }

  const { rank, totalScore, solvedProblems, totalNoOfParticipants, AllProblemsWithScore } = contestResult;
  const totalProblemsCount = AllProblemsWithScore.length;

  // --- Chart Data Preparation ---
  const getProblemMaxScoreForChart = (difficulty) => {
    if (difficulty === "hard") return 100;
    if (difficulty === "easy") return 20;
    if (difficulty === "medium") return 50;
    return 0;
  };

  let solvedCount = 0;
  let attemptedButUnsolvedCount = 0;
  let notAttemptedCount = 0;

  AllProblemsWithScore.forEach(problem => {
    const maxScore = getProblemMaxScoreForChart(problem.difficulty);
    // Check if userScore is provided and if it's explicitly 0 or matches max score
    if (problem.userScore !== undefined) {
      if (problem.userScore > 0 && problem.userScore === maxScore) {
        solvedCount++;
      } else {
        attemptedButUnsolvedCount++;
      }
    } else { // No userScore property means not attempted
      notAttemptedCount++;
    }
  });

  const chartData = {
    labels: ['Solved', 'Attempted (Unsolved)', 'Not Attempted'],
    datasets: [
      {
        label: 'Problems',
        data: [solvedCount, attemptedButUnsolvedCount, notAttemptedCount],
        backgroundColor: [
          'rgba(74, 222, 128, 0.8)', // Tailwind green-400
          'rgba(250, 204, 21, 0.8)',  // Tailwind yellow-400
          'rgba(156, 163, 175, 0.8)', // Tailwind gray-400
        ],
        borderColor: [
          'rgba(74, 222, 128, 1)',
          'rgba(250, 204, 21, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#E2E8F0', // text-gray-200 for legend labels
          font: {
            size: 14,
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          }
        },
        backgroundColor: 'rgba(30, 41, 59, 0.9)', // Dark background for tooltip
        titleColor: '#E2E8F0',
        bodyColor: '#CBD5E1',
        borderColor: '#60A5FA',
        borderWidth: 1
      }
    },
  };
  // --- End Chart Data Preparation ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] font-sans text-white p-6 sm:p-10 relative overflow-hidden">
      {/* Subtle animated background (starfield/nebula) */}
      <div className="absolute inset-0 z-0 opacity-10 animate-subtle-move"
           style={{
             backgroundImage: 'radial-gradient(circle at 15% 50%, #60a5fa, transparent), radial-gradient(circle at 85% 50%, #a855f7, transparent), radial-gradient(circle at 50% 15%, #38bdf8, transparent), radial-gradient(circle at 50% 85%, #d946ef, transparent)',
             backgroundSize: '200% 200%',
           }}>
      </div>

      <div className="max-w-6xl mx-auto relative z-10"> {/* Increased max-width for better layout with chart */}
        <h1 className="text-5xl font-extrabold text-center text-blue-400 mb-10 animate-fade-in-down drop-shadow-lg [text-shadow:0_0_20px_rgba(59,130,246,0.6)]">
          Contest Performance Summary
        </h1>

        {/* User Summary Section */}
        <div className="card bg-gray-900/50 backdrop-blur-sm text-gray-100 shadow-2xl mb-12 transform hover:scale-[1.005] transition-transform duration-300 border border-blue-700/50 rounded-box">
          <div className="card-body p-6 sm:p-8">
            <h2 className="card-title text-3xl mb-6 flex items-center justify-center sm:justify-start text-blue-300">
              <Trophy className="mr-3 text-amber-300 animate-pulse-slow" size={36} /> Your Key Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {/* Your Rank */}
              <div className="stat bg-gray-800/60 rounded-lg p-4 shadow-inner text-gray-200 border border-gray-700">
                <div className="stat-figure text-blue-400">
                  <Hash size={28} />
                </div>
                <div className="stat-title text-blue-300">Your Rank</div>
                <div className="stat-value text-blue-200">{rank || 'N/A'}</div>
              </div>

              {/* Problems Solved */}
              <div className="stat bg-gray-800/60 rounded-lg p-4 shadow-inner text-gray-200 border border-gray-700">
                <div className="stat-figure text-green-400">
                  <CheckCircle size={28} />
                </div>
                <div className="stat-title text-green-300">Problems Solved</div>
                <div className="stat-value text-green-200">{solvedProblems || 0} / {totalProblemsCount}</div>
              </div>

              {/* Total Score */}
              <div className="stat bg-gray-800/60 rounded-lg p-4 shadow-inner text-gray-200 border border-gray-700">
                <div className="stat-figure text-yellow-400">
                  <Award size={28} />
                </div>
                <div className="stat-title text-yellow-300">Total Score</div>
                <div className="stat-value text-yellow-200">{totalScore || 0}</div>
              </div>

              {/* Total Participants */}
              <div className="stat bg-gray-800/60 rounded-lg p-4 shadow-inner text-gray-200 border border-gray-700">
                <div className="stat-figure text-purple-400">
                  <Users size={28} />
                </div>
                <div className="stat-title text-purple-300">Participants</div>
                <div className="stat-value text-purple-200">{totalNoOfParticipants || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart and Problems List Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Performance Overview Chart */}
          <div className="card bg-gray-900/50 backdrop-blur-sm text-gray-100 shadow-xl border border-blue-700/50 rounded-box flex items-center justify-center p-6">
            <h3 className="text-2xl font-bold text-white mb-4 w-full text-center">Problem Status Distribution</h3>
            <div className="h-64 w-full"> {/* Fixed height for chart */}
              <Pie data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Additional Stats/Insights */}
          <div className="card bg-gray-900/50 backdrop-blur-sm text-gray-100 shadow-xl border border-blue-700/50 rounded-box p-6 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-white mb-4 w-full text-center">Insights & Milestones</h3>
            <ul className="text-lg space-y-2">
              <li className="flex items-center text-gray-300"><TrendingUp size={20} className="mr-3 text-green-400" /> Great progress! Keep pushing!</li>
              <li className="flex items-center text-gray-300"><TrendingDown size={20} className="mr-3 text-red-400" /> Challenges are opportunities for growth.</li>
              {totalScore > 0 && <li className="flex items-center text-gray-300"><Award size={20} className="mr-3 text-yellow-400" /> You're on the leaderboard!</li>}
              {solvedProblems > 0 && <li className="flex items-center text-gray-300"><CheckCircle size={20} className="mr-3 text-blue-400" /> First problem conquered!</li>}
              {totalProblemsCount > 0 && solvedProblems === totalProblemsCount && (
                <li className="flex items-center text-gray-300"><Trophy size={20} className="mr-3 text-amber-400" /> All problems solved! Amazing!</li>
              )}
              {totalProblemsCount > 0 && solvedProblems < totalProblemsCount && solvedProblems > 0 && (
                <li className="flex items-center text-gray-300"><Code size={20} className="mr-3 text-cyan-400" /> You've still got more problems to master.</li>
              )}
               {totalScore === 0 && (
                <li className="flex items-center text-gray-300"><Info size={20} className="mr-3 text-blue-400" /> Participate actively to see your stats grow!</li>
              )}
            </ul>
          </div>
        </div>

        {/* Contest Problems List */}
        <h2 className="text-3xl font-bold text-white mb-6 text-center sm:text-left animate-fade-in drop-shadow-md">
          Contest Problems Overview
        </h2>
        <div className="space-y-4">
          {AllProblemsWithScore.length > 0 ? (
            AllProblemsWithScore.map((problem) => (
              <ProblemCard
                key={problem._id}
                problem={problem} // Pass the entire problem object directly
                contestId={contestId}
              />
            ))
          ) : (
            <div className="alert alert-info shadow-lg bg-gray-800/60 text-blue-300 border-blue-700/50">
              <Info className="stroke-current shrink-0 h-6 w-6 text-blue-400" />
              <span>No problems found for this contest.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestResult;