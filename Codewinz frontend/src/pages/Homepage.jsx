import { useDispatch, useSelector } from "react-redux"

import { useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";





function Homepage(){
    const dispatch=useDispatch();
    const {isAuthenticated,user}=useSelector((state)=>state.auth)
    const navigate=useNavigate();
    useEffect(()=>{
      // console.log(isAuthenticated)
        if(!isAuthenticated)
            navigate("/login");
    },[isAuthenticated]);


  //  console.log(user.role);





   return (
  <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] font-sans text-white relative">

    {/* 🌐 Navbar */}
    <Navbar />

    {/* 🛡️ Admin Button (Top-right) */}
    { (user.role==='admin'&&
      <button
        onClick={() => navigate('/admin')}
        className="absolute z-20 top-6 right-30  btn btn-sm btn-outline border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition"
      >
        Admin Panel
      </button>
    )}

    {/* 📦 Body */}
    <div className="flex items-center pt-25 gap-20 flex-col p-6">
      <div className="text-center">
        <h2 className="text-3xl font-semibold mb-2">Welcome back, {user.firstName}! </h2>
        <p className="text-gray-300">Get started by solving today's Problem of the Day.</p>
      </div>

      {/* 🧩 Main Cards */}
      <div className="px-8 py-14">
        <div className="flex">

          {/* Card 1
          <button className="bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-transform duration-300 border border-slate-700 hover:border-cyan-500 cursor-pointer">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">🧠 AI Assistant</h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              Get instant hints, explanations, and solution breakdowns powered by smart AI to speed up your learning journey.
            </p>
          </button> */}

          {/* Card 2 */}
          <button
            onClick={() => navigate('/Homepage/problems')}
            className="bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-transform duration-300 border border-slate-700 hover:border-purple-500 cursor-pointer"
          >
            <h3 className="text-2xl font-bold text-purple-400 mb-4"> Solve Problems</h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              Practice handpicked DSA challenges every day to stay consistent and level up your coding skills.
            </p>
          </button>

          {/* Card 3
          <button className="bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-transform duration-300 border border-slate-700 hover:border-yellow-400 cursor-pointer">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">⭐ Favourite Problems</h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              Bookmark your favorite problems to revisit later for revision, practice, and mastery tracking.
            </p>
          </button> */}

        </div>
      </div>
    </div>
  </div>
);

}

export default Homepage