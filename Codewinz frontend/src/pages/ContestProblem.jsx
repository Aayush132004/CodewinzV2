import React from 'react'
import Navbar from '../components/Navbar'
//////////////component for displaying all problems in my contest page ////////////////////////////
import { useSelector } from 'react-redux'
import axiosClient from '../../utils/axiosClient'

import { useState,useEffect } from 'react'
import { useParams } from 'react-router'
import { useNavigate } from 'react-router'
import ContestTimer from '../components/ContestTimer'
const ContestProblem = () => {
//states required form my this component
 const{user}=useSelector((state)=>state.auth);
 const navigate=useNavigate();
 const [problems,setProblems]=useState([]);
  const[load,setLoad]=useState(true);
  const[startDate,setStartDate]=useState(Date.now());
  const[endDate,setendDate]=useState(Date.now());
///this is contest id i need to send this to contestSubmission page also so that can store in db of contestSubmission hence can filter based on contestId,problemId,userId(this i can get from req.result._id as from token basically through user middleware)
const {id}=useParams();
const contestId=id;
//require to call problam and solvedProblem function initially hence useEffect
//and required to fetch solved problem when user changes hence dependency
useEffect(()=>{
    
        //fn for all problems
    const fetchProblems=async()=>{
        try{
        const response=await axiosClient.get(`/contest/getContestById/${id}`);
        //setting these fetched problem
        console.log(response);
        const start=response.data.startDate;
        setStartDate(start);
        const end=response.data.endDate;
        setendDate(end);
        //got problem ids now fetch problem api to get those id problems
        const problemId=response.data.problems;
        // mltiple api calls to get all problem one by one problem by id api of our backend
        const problemPromises = problemId.map(pid =>
        axiosClient.get(`/problem/problemById/${pid}`)
      );
      const problemResponses = await Promise.all(problemPromises);

      // Step 4: Extract problem data and set to state
      const fullProblems = problemResponses.map(res => res.data);
    //   console.log(fullProblems)
      setProblems(fullProblems);

        
         setLoad(false);
       
        }
   

    catch(err){
         console.error('Error fetching all problems:',err);
        }
    }
    fetchProblems();
},[user]);

  const helper=(v)=>{
   if (v=="hard")
   return 100;
   else if(v=="medium")
    return 50;
   else if(v=="easy")
    return 20;
  }


  return (
    <div className='relative min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] font-sans text-white'>
        <Navbar/>
       { load?<div className='flex  justify-center items-center h-screen'><span className="loading loading-spinner loading-lg text-primary"></span></div>:
       <div className='flex mt-10 justify-center items-center '>
       <div className='w-[70%] '>
       
       <div className='flex justify-between items-center flex-col gap-5 mt-15'>
        <div className='flex justify-center items-center'>
          <ContestTimer startDate={startDate} endDate={endDate}/>
      </div>
            {
                 problems.map((problem,i)=>{
                 return (
    <div onClick={()=>{navigate(`/contestproblem/${contestId}/${problem._id}`)}} className="flex items-center justify-between gap-6 bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl shadow-lg border border-slate-700 hover:border-blue-500 hover:shadow-blue-500/20 transition-all duration-200 w-full ">
      
      {/* Left: Title + Tags */}
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-white tracking-tight">{problem.title}</h3>
       
      </div>

      {/* Center: Difficulty */}
      <span
        className={`text-sm capitalize  px-3 py-1 rounded-full text-green-400 font-bold drop-shadow-[0_0_4px_#32CD32] `}
      >
        {helper(problem.difficulty)}
      </span>
    </div>
  );
                })
            }

       </div>
       </div>
      
       </div>
      }
      
        
    </div>
  )
}

export default ContestProblem
