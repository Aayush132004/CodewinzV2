import { CheckCircle2 } from "lucide-react"; // leetcode-like tick icon
import { Navigate } from "react-router";
import { useNavigate } from "react-router";

function ProblemCard({problem,solvedProblem}) {
  const navigate=useNavigate();
  const {tags,title,difficulty}=problem
  const difficultyColors = {
    easy: "text-green-400 bg-green-900",
    medium: "text-yellow-400 bg-yellow-900",
    hard: "text-red-400 bg-red-900",
  };

  return (
    <div onClick={()=>{navigate(`/problem/${problem._id}`)}} className="flex items-center justify-between gap-6 bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl shadow-lg border border-slate-700 hover:border-blue-500 hover:shadow-blue-500/20 transition-all duration-200 w-5xl ">
      
      {/* Left: Title + Tags */}
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 mt-1 px-2 py-0.5 bg-slate-700 rounded-md w-fit">{tags}</p>
      </div>

      {/* Center: Difficulty */}
      <span
        className={`text-sm capitalize font-medium px-3 py-1 rounded-full ${difficultyColors[difficulty]} shadow-sm`}
      >
        {difficulty}
      </span>

      {/* Right: Solved Tick */}
      {solvedProblem.some((sp) => sp._id === problem._id) && (
        <CheckCircle2 size={24} className="text-green-400" />
      )}
    </div>
  );
}

export default ProblemCard;
