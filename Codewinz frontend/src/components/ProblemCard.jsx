import { CheckCircle2, Clock, TrendingUp, Code, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

function ProblemCard({ problem, solvedProblem }) {
  const navigate = useNavigate();
  const { tags, title, difficulty, _id, description, likes, submissions } = problem;

  // Check if problem is solved
  const isSolved = solvedProblem?.some((sp) => sp._id === _id);

  // Difficulty configurations with enhanced styling
  const difficultyConfig = {
    easy: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      glow: "shadow-emerald-500/20",
      icon: "🟢"
    },
    medium: {
      text: "text-amber-400", 
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      glow: "shadow-amber-500/20",
      icon: "🟡"
    },
    hard: {
      text: "text-red-400",
      bg: "bg-red-500/10", 
      border: "border-red-500/30",
      glow: "shadow-red-500/20",
      icon: "🔴"
    }
  };

  const config = difficultyConfig[difficulty] || difficultyConfig.medium;

  // Handle tag display - show first few tags if multiple
  const displayTags = Array.isArray(tags) ? tags.slice(0, 3) : [tags];
  const hasMoreTags = Array.isArray(tags) && tags.length > 3;

  // Dynamic time estimates based on difficulty
  const getTimeEstimate = (difficulty) => {
    const timeEstimates = {
      easy: "5-15 min",
      medium: "15-30 min", 
      hard: "30-60 min"
    };
    return timeEstimates[difficulty] || "15-30 min";
  };

  // Get time estimate for current problem
  const timeEstimate = getTimeEstimate(difficulty);

  // Tag colors for different categories
  const getTagColor = (tag) => {
    const tagColors = {
      array: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      linkedList: "bg-purple-500/20 text-purple-300 border-purple-500/30", 
      tree: "bg-green-500/20 text-green-300 border-green-500/30",
      graph: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      string: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      dp: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      stack: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      queue: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      bst: "bg-violet-500/20 text-violet-300 border-violet-500/30"
    };
    return tagColors[tag?.toLowerCase()] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  return (
    <div 
      onClick={() => navigate(`/problem/${_id}`)}
      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 ease-out transform hover:scale-[1.02] ${
        isSolved ? 'hover:shadow-2xl hover:shadow-green-500/10' : 'hover:shadow-2xl hover:shadow-blue-500/10'
      }`}
    >
      {/* Main Card Container */}
      <div className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
        isSolved 
          ? 'border-green-500/20 shadow-lg shadow-green-500/5' 
          : 'border-slate-700/50 group-hover:border-blue-500/40'
      }`}>
        
        {/* Solved Status Indicator */}
        {isSolved && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle2 size={14} className="text-white" />
          </div>
        )}

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

        <div className="relative p-6">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {/* Problem Title */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`text-xl font-bold tracking-tight transition-colors duration-200 ${
                  isSolved ? 'text-green-100' : 'text-white group-hover:text-blue-100'
                }`}>
                  {title}
                </h3>
                {isSolved && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                    <CheckCircle2 size={12} className="text-green-400" />
                    <span className="text-xs font-medium text-green-300">Solved</span>
                  </div>
                )}
              </div>

              {/* Problem Description Preview */}
              {description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {description.length > 100 ? `${description.substring(0, 100)}...` : description}
                </p>
              )}

              {/* Tags Section */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Code size={14} className="text-slate-500" />
                {displayTags.map((tag, index) => (
                  <span
                    key={index}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all duration-200 hover:scale-105 ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
                {hasMoreTags && (
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full border border-slate-600/50">
                    +{Array.isArray(tags) ? tags.length - 3 : 0} more
                  </span>
                )}
              </div>
            </div>

            {/* Right Side - Difficulty Badge */}
            <div className="flex flex-col items-end gap-3 ml-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 group-hover:scale-105 ${config.bg} ${config.border} ${config.text} shadow-lg ${config.glow}`}>
                <span className="text-sm">{config.icon}</span>
                <span className="text-sm font-bold capitalize tracking-wide">
                  {difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-6 text-xs text-slate-400">
              {likes !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-yellow-500" />
                  <span>{likes || 0} likes</span>
                </div>
              )}
              {submissions !== undefined && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-blue-400" />
                  <span>{submissions || 0} submissions</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock size={12} className={`${
                  difficulty === 'hard' ? 'text-red-400' : 
                  difficulty === 'medium' ? 'text-amber-400' : 
                  'text-green-400'
                }`} />
                <span className={`font-medium ${
                  difficulty === 'hard' ? 'text-red-300' : 
                  difficulty === 'medium' ? 'text-amber-300' : 
                  'text-green-300'
                }`}>
                  {timeEstimate}
                </span>
              </div>
            </div>

            {/* Action Indicator */}
            <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-400 transition-colors duration-200">
              <span className="text-xs font-medium">Solve Problem</span>
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>

        {/* Progress Bar for Solved Problems */}
        {isSolved && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-b-2xl" />
        )}
      </div>
    </div>
  );
}

export default ProblemCard;