import React, { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Filter from '../components/Filter'
import { useSelector } from 'react-redux'
import axiosClient from '../../utils/axiosClient'
import ProblemCard from '../components/ProblemCard'
import Pagination from '../components/Pagination'

const Problems = () => {
  // States required for this component
  const { user } = useSelector((state) => state.auth);
  const [allProblems, setAllProblems] = useState([]); // Store all problems
  const [problems, setProblems] = useState([]); // Store current page problems
  const [solvedproblem, setSolvedProblem] = useState([]);
  const [filter, setFilter] = useState({
    difficulty: "all",
    tag: "all",
    status: "all",
  });

  // State for pagination and loading
  const [page, setPage] = useState(1);
  const [load, setLoad] = useState(true);
  const [pageLoad, setPageLoad] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Items per page
  const ITEMS_PER_PAGE = 6;

  // Fetch all problems initially and solved problems
  useEffect(() => {
    const fetchAllProblems = async () => {
      try {
        setLoad(true);
        // Fetch all problems without pagination to get complete dataset
        const response = await axiosClient.get('/problem/getAllProblem?limit=1000'); // Large limit to get all
        setAllProblems(response.data.allProblems || []);
        setLoad(false);
      } catch (err) {
        console.error('Error fetching all problems:', err);
        setAllProblems([]);
        setLoad(false);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const response = await axiosClient.get("/problem/problemSolvedByUser");
        setSolvedProblem(response.data || []);
      } catch (err) {
        console.error('Error fetching solved problems:', err);
        setSolvedProblem([]);
      }
    };

    fetchAllProblems();
    if (user) {
      fetchSolvedProblems();
    }
  }, [user]);

  // Filter and paginate problems when filters or page changes
  useEffect(() => {
    if (allProblems.length === 0) return;

    setPageLoad(true);
    setIsTransitioning(true);

    // Apply filters to all problems
    const filtered = allProblems.filter(problem => {
      const difficultyMatch = filter.difficulty === "all" || problem.difficulty === filter.difficulty;
      const tagMatch = filter.tag === "all" || (problem.tags && problem.tags.includes(filter.tag));
      const statusMatch = filter.status === "all" || 
        (filter.status === "solved" && solvedproblem.some(sp => sp._id === problem._id)) ||
        (filter.status === "unsolved" && !solvedproblem.some(sp => sp._id === problem._id));
      return difficultyMatch && tagMatch && statusMatch;
    });

    // Calculate pagination for filtered results
    const totalFilteredPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProblems = filtered.slice(startIndex, endIndex);

    // Update state with smooth transition
    setTimeout(() => {
      setProblems(paginatedProblems);
      setTotalPage(totalFilteredPages);
      setPageLoad(false);
      setIsTransitioning(false);
    }, 300);

  }, [allProblems, filter, page, solvedproblem]);

  // Reset page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filter.difficulty, filter.tag, filter.status]);

  // Filter options with updated tags
  const statusProp = [
    { data: "All Problems", value: "all" },
    { data: "Solved Problems", value: "solved" },
    { data: "Unsolved Problems", value: "unsolved" }
  ];

  const difficultyProp = [
    { data: "All Difficulties", value: "all" },
    { data: "Easy", value: "easy" },
    { data: "Medium", value: "medium" },
    { data: "Hard", value: "hard" }
  ];

  const tagProp = [
    { data: "All Tags", value: "all" },
    { data: "Array", value: "array" },
    { data: "Linked List", value: "linkedList" },
    { data: "Graph", value: "graph" },
    { data: "Tree", value: "tree" },
    { data: "String", value: "string" },
    { data: "Dynamic Programming", value: "dp" },
    { data: "Stack", value: "stack" },
    { data: "Queue", value: "queue" },
    { data: "Binary Search Tree", value: "bst" }
  ];

  // Calculate statistics safely
  const totalProblems = allProblems?.length || 0;
  const solvedCount = solvedproblem?.length || 0;
  const remainingCount = Math.max(0, totalProblems - solvedCount);

  // Calculate filtered count safely
  const filteredCount = allProblems.length > 0 ? allProblems.filter(problem => {
    const difficultyMatch = filter.difficulty === "all" || problem.difficulty === filter.difficulty;
    const tagMatch = filter.tag === "all" || (problem.tags && problem.tags.includes(filter.tag));
    const statusMatch = filter.status === "all" || 
      (filter.status === "solved" && solvedproblem.some(sp => sp._id === problem._id)) ||
      (filter.status === "unsolved" && !solvedproblem.some(sp => sp._id === problem._id));
    return difficultyMatch && tagMatch && statusMatch;
  }).length : 0;

  // Loading skeleton component
  const ProblemSkeleton = () => (
    <div className="w-full animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-800/50 rounded-xl p-6 mb-4 border border-slate-700/50">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 bg-slate-700 rounded w-3/4"></div>
            <div className="h-6 bg-slate-700 rounded w-16"></div>
          </div>
          <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-2/3 mb-4"></div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-6 bg-slate-700 rounded w-16"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Page transition loader
  const PageLoader = () => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full border-t-purple-500 animate-spin animate-reverse"></div>
        </div>
        <p className="text-slate-300 font-medium">Loading problems...</p>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800'>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
           
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Challenge yourself with our curated collection of programming problems. 
              Track your progress and master algorithms step by step.
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{totalProblems} Total Problems</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>{solvedCount} Solved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>{remainingCount} Remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            Filter Problems
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <Filter option={statusProp} field="status" state={{ setFilter, filter }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Difficulty</label>
              <Filter option={difficultyProp} field="difficulty" state={{ setFilter, filter }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Tags</label>
              <Filter option={tagProp} field="tag" state={{ setFilter, filter }} />
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-700/50">
            <span className="text-sm text-slate-400">Active filters:</span>
            {filter.status !== "all" && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
                {statusProp.find(s => s.value === filter.status)?.data}
              </span>
            )}
            {filter.difficulty !== "all" && (
              <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium border border-orange-500/30">
                {difficultyProp.find(d => d.value === filter.difficulty)?.data}
              </span>
            )}
            {filter.tag !== "all" && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                {tagProp.find(t => t.value === filter.tag)?.data}
              </span>
            )}
            {filter.status === "all" && filter.difficulty === "all" && filter.tag === "all" && (
              <span className="px-3 py-1 bg-slate-600/20 text-slate-400 rounded-full text-xs">No filters applied</span>
            )}
          </div>
        </div>
      </div>

      {/* Problems Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {load ? (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
            <ProblemSkeleton />
          </div>
        ) : (
          <div className="relative">
            <div className={`bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 transition-all duration-300 ${
              isTransitioning ? 'opacity-50 scale-98' : 'opacity-100 scale-100'
            }`}>
              
              {/* Results Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                    Problems ({filteredCount})
                  </h2>
                  <p className="text-slate-400 mt-1">
                    Page {page} of {totalPage} • Showing {problems.length} of {filteredCount} problems
                  </p>
                </div>
                
               
              </div>

              {/* Problems Grid */}
              {problems.length > 0 ? (
                <div className="space-y-4">
                  {problems.map((problem, i) => (
                    <div 
                      key={problem._id || i} 
                      className={`transform transition-all duration-500 ${
                        isTransitioning 
                          ? 'translate-y-4 opacity-0' 
                          : 'translate-y-0 opacity-100'
                      }`}
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      <ProblemCard 
                        solvedProblem={solvedproblem} 
                        problem={problem} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No problems found</h3>
                  <p className="text-slate-500 mb-6">Try adjusting your filters to see more problems.</p>
                  <button 
                    onClick={() => setFilter({ difficulty: "all", tag: "all", status: "all" })}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Page Loading Overlay */}
            {pageLoad && <PageLoader />}
          </div>
        )}

        {/* Pagination */}
        {!load && totalPage > 1 && (
          <div className="flex justify-center mt-12">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
              <Pagination option={{ page, setPage, totalPage }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Problems;