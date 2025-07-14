import React, { useEffect,useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../utils/axiosClient';


const Profile = () => {
  const [user,setUser]=useState(null);
//   const {
//     name,
//     email,
//     avatarUrl,
//     questionsSolved,
//     totalQuestions,
//     loginDays,
//   } = user;

useEffect(()=>{
   async function fetchUser(){
        try{
 const response=await axiosClient.get("/user/profile")
 console.log(response);
  const {
    name,
    email,
    questionsSolved,
    totalQuestions,
    profile
 }=response.data;
 setUser({name,email,questionsSolved,totalQuestions,profile});
        }
        catch(err){
       console.log(err);
        }
    }
    fetchUser();
},[])



 
  
  let loginDays= 42
return !user ? (
  // 🔄 Full-screen loading spinner from DaisyUI
  <div className="min-h-screen bg-base-200 flex items-center justify-center">
    <span className="loading loading-spinner loading-lg text-primary"></span>
  </div>
):(
    <div className="min-h-screen  bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] bg-base-200 flex flex-col items-center p-6">
      {/* Profile Avatar */}
       <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-xl mt-6">
        <img src={user.profile} alt="Profile" className="w-full h-full object-cover" />
      </div> 
     

      {/* Name and Email */}
      <h1 className="text-3xl font-bold mt-4 text-center">{user?.name}</h1>
      <p className="text-sm text-gray-500 mt-1">{user?.email}</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-center">
        {/* Questions Solved */}
        <div className="card w-72 bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-primary">Questions Solved</h2>
            <AnimatePresence>
              <motion.h1
                key={user?.questionsSolved}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-4xl font-bold text-success"
              >
                {user?.questionsSolved} / {user?.totalQuestions}
              </motion.h1>
            </AnimatePresence>
          </div>
        </div>

        {/* Login Days */}
        <div className="card w-72 bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-primary">Login Streak</h2>
            <motion.h1
              key={loginDays}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold text-accent"
            >
              {loginDays} days
            </motion.h1>
          </div>
        </div>
      </div>

      {/* Action Buttons
      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <a href="/favourites" className="btn btn-primary">
          View Favourite Problems
        </a>
        <a href="/solved" className="btn btn-outline btn-secondary">
          Check Solved Problems
        </a>
      </div> */}
    </div>
  );
};

export default Profile;
