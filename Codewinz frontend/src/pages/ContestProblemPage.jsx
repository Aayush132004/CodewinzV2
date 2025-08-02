import React from 'react'
import Navbar from '../components/Navbar'
import { useSelector } from 'react-redux'
import axiosClient from '../../utils/axiosClient'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { useNavigate } from 'react-router'
import ContestTimer from '../components/ContestTimer'

const ContestProblem = () => {
  // States required for this component
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [load, setLoad] = useState(true);
  const [startDate, setStartDate] = useState(Date.now());
  const [endDate, setendDate] = useState(Date.now());
  
  // Contest ID from params
  const { id } = useParams();
  const contestId = id;

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get(`/contest/getContestById/${id}`);
        console.log(response);
        
        const start = response.data.startDate;
        setStartDate(start);
        const end = response.data.endDate;
        setendDate(end);
        
        const problemId = response.data.problems;
        const problemPromises = problemId.map(pid =>
          axiosClient.get(`/problem/problemById/${pid}`)
        );
        const problemResponses = await Promise.all(problemPromises);
        const fullProblems = problemResponses.map(res => res.data);
        console.log(fullProblems)
        setProblems(fullProblems);
        setLoad(false);
      } catch (err) {
        console.error('Error fetching all problems:', err);
      }
    }
    fetchProblems();
  }, [user]);

  const helper = (v) => {
    if (v === "hard") return 100;
    else if (v === "medium") return 50;
    else if (v === "easy") return 20;
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-emerald-400/20";
      case "medium":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-amber-400/20";
      case "hard":
        return "text-red-400 bg-red-400/10 border-red-400/20 shadow-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20 shadow-gray-400/20";
    }
  }

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800'>
      <Navbar />
      
      {load ? (
        <div className='flex justify-center items-center h-screen'>
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin animation-delay-150"></div>
          </div>
        </div>
      ) : (
        <div className='container pt-20 mx-auto px-4 py-8'>
          <div className='max-w-4xl mx-auto'>
            
            {/* Contest Timer Section */}
            <div className='mb-12 flex justify-center'>
              <div className='backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl'>
                <ContestTimer startDate={startDate} endDate={endDate} />
              </div>
            </div>

            {/* Contest Stats */}
            <div className='mb-8 grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Total Problems */}
              <div className='backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 text-center'>
                <div className='text-2xl font-bold text-blue-400 mb-1'>
                  {problems.length}
                </div>
                <div className='text-sm text-slate-400 uppercase tracking-wide'>
                  Total Problems
                </div>
              </div>

              {/* Total Points */}
              <div className='backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 text-center'>
                <div className='text-2xl font-bold text-emerald-400 mb-1'>
                  {problems.reduce((total, problem) => total + helper(problem.difficulty), 0)}
                </div>
                <div className='text-sm text-slate-400 uppercase tracking-wide'>
                  Total Points
                </div>
              </div>

              {/* Contest Duration */}
              <div className='backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center'>
                <div className='text-2xl font-bold text-amber-400 mb-1'>
                  {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60))}h
                </div>
                <div className='text-sm text-slate-400 uppercase tracking-wide'>
                  Duration
                </div>
              </div>
            </div>

            {/* Problems Grid */}
            <div className='space-y-4'>
              <div className='mb-8'>
                <h2 className='text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2'>
                  Contest Problems
                </h2>
                <div className='h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full'></div>
              </div>

              {problems.map((problem, i) => (
                <div
                  key={problem._id}
                  onClick={() => { navigate(`/contestproblem/${contestId}/${problem._id}`) }}
                  className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                >
                  {/* Background Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl"></div>
                  </div>

                  {/* Problem Number Badge */}
                  <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {i + 1}
                  </div>

                  <div className="relative flex items-center justify-between ml-12">
                    {/* Problem Title */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors duration-200 mb-1">
                        {problem.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        Problem {i + 1}
                      </div>
                    </div>

                    {/* Difficulty and Points */}
                    <div className="flex items-center gap-4">
                      {/* Points */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {helper(problem.difficulty)}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">
                          Points
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <div className={`px-4 py-2 rounded-xl border font-medium text-sm capitalize transition-all duration-200 ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </div>
                    </div>
                  </div>

                 
                </div>
              ))}
            </div>

            {/* Empty State */}
            {problems.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Problems Available</h3>
                <p className="text-slate-500">Problems will appear here once the contest is configured.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ContestProblem
