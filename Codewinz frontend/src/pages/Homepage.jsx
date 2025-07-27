import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, Code, Star, Award, Zap } from 'lucide-react';
import { useEffect } from "react";
import { useNavigate } from "react-router"; // Corrected import
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VoidBackground from "../components/VoidBackground";

function Homepage() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const displayUserName = user?.firstName || "Coder";

  return (
    <div className="min-h-screen  flex flex-col bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] font-sans text-white relative">
      {/* 🚀 3D Void Background */}
      <VoidBackground />

      {/* 🌐 Navbar */}
      <Navbar />

      {/* 📦 Main Content Wrapper (Above 3D background) */}
      {/* Added pt-24 for top padding to clear the Navbar */}
      <div className="relative mt-10 z-10 flex flex-col items-center justify-center flex-grow pt-24 p-6 sm:p-10"> 

        {/* ⭐ Hero Section */}
        <div className="text-center mb-16 animate-fade-in-down max-w-3xl">
          <h2 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight drop-shadow-lg [text-shadow:0_0_25px_rgba(59,130,246,0.6)]">
            Welcome back, <span className="text-blue-400">{displayUserName}!</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 font-light">
            Forge your skills, conquer challenges, and ascend the ranks of competitive programming.
          </p>
          <button
            onClick={() => navigate('/contests')}
            className="btn btn-lg btn-outline btn-info hover:bg-blue-600 hover:text-white text-blue-400 border-blue-400 hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Zap size={24} /> Dive into Contests
          </button>
        </div>

        {/* 🧩 Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 px-4 w-full max-w-6xl">
          {/* Card 1: Contests */}
          <button
            onClick={() => navigate('/contests')}
            className="card bg-gray-900/60 backdrop-blur-sm text-gray-100 shadow-xl border border-blue-700/50 hover:border-blue-500 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer p-8 rounded-2xl flex flex-col items-center text-center group"
          >
            <CalendarDays className="text-blue-400 mb-6 group-hover:text-blue-300 transition-colors" size={60} />
            <h3 className="text-3xl font-bold text-blue-300 mb-4 group-hover:text-blue-200 transition-colors">
              Compete in Contests
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed font-light">
              Challenge your limits in coding competitions, track your progress on dynamic leaderboards, and win exciting prizes.
            </p>
          </button>

          {/* Card 2: Solve Problems */}
          <button
            onClick={() => navigate('/Homepage/problems')}
            className="card bg-gray-900/60 backdrop-blur-sm text-gray-100 shadow-xl border border-purple-700/50 hover:border-purple-500 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer p-8 rounded-2xl flex flex-col items-center text-center group"
          >
            <Code className="text-purple-400 mb-6 group-hover:text-purple-300 transition-colors" size={60} />
            <h3 className="text-3xl font-bold text-purple-300 mb-4 group-hover:text-purple-200 transition-colors">
              Sharpen Your Skills
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed font-light">
              Practice handpicked DSA challenges daily to stay consistent and significantly level up your coding skills.
            </p>
          </button>

          {/* Card 3: Curate Your Favorites */}
          <button
            onClick={() => alert("Coming Soon: Favorite Problems!")}
            className="card bg-gray-900/60 backdrop-blur-sm text-gray-100 shadow-xl border border-yellow-700/50 hover:border-yellow-500 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer p-8 rounded-2xl flex flex-col items-center text-center group"
          >
            <Star className="text-yellow-400 mb-6 group-hover:text-yellow-300 transition-colors" size={60} />
            <h3 className="text-3xl font-bold text-yellow-300 mb-4 group-hover:text-yellow-200 transition-colors">
              Curate Your Favorites
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed font-light">
              Bookmark your most insightful problems to revisit later for revision, targeted practice, and mastery tracking.
            </p>
          </button>
        </div>

        {/* ✨ Why CodeWinz? - Promotional Section */}
        <div className="max-w-4xl w-full text-center mb-20 animate-fade-in">
          <h3 className="text-4xl font-bold text-white mb-8 drop-shadow-md">Why Choose <span className="text-blue-400">CodeWinz</span>?</h3> {/* Changed to CodeWinz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-blue-800/50 hover:border-blue-600 transition-colors duration-300">
              <h4 className="text-xl font-semibold text-blue-300 mb-3 flex items-center"> Real-time Feedback</h4>
              <p className="text-gray-300 text-base">Get instant results and detailed insights on your code submissions, helping you learn faster and improve efficiently.</p>
            </div>
            <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-blue-800/50 hover:border-blue-600 transition-colors duration-300">
              <h4 className="text-xl font-semibold text-blue-300 mb-3 flex items-center">Thriving Community</h4>
              <p className="text-gray-300 text-base">Join a vibrant community of passionate coders. Share knowledge, collaborate, and grow together.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Footer */}
      <Footer />
    </div>
  );
}

export default Homepage;  