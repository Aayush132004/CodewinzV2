import React, { useState,useEffect,useRef } from 'react'
import Navbar from '../components/Navbar'
import  Filter  from '../components/Filter'
import { useSelector } from 'react-redux'
import axiosClient from '../../utils/axiosClient'
import ProblemCard from '../components/ProblemCard'
import Pagination from '../components/Pagination'

const Problems = () => {
//states required form my this component
 const{user}=useSelector((state)=>state.auth);
 const [problems,setProblems]=useState([]);
const [solvedproblem,setSolvedProblem]=useState([]);
const[filter,setFilter]=useState({
    difficulty:"all",
    tag:"all",
    status:"all",
});
//state for pagination 
const [page,setPage]=useState(1);
const[totalPage,setTotalPage]=useState();


//require to call problam and solvedProblem function initially hence useEffect
//and required to fetch solved problem when user changes hence dependency
useEffect(()=>{
    
        //fn for all problems
    const fetchProblems=async()=>{
        try{
            const limit=4;
        const response=await axiosClient.get(`/problem/getAllProblem?page=${page}&limit=${limit}`);
        //setting these fetched problem

        setProblems(response.data.allProblems);
        setPage(response.data.currentPage);
        setTotalPage(response.data.totalPage);
       
        }
   

    catch(err){
         console.error('Error fetching all problems:',err);
        }
    }
    //for solved problems 
      
    const fetchSolvedProblems=async()=>{
        try{
             
        const response=await axiosClient.get("/problem/problemSolvedByUser");
        //setting these fetched problem
        setSolvedProblem(response.data);
        }

      catch(err){
         console.error('Error fetching solved problems:',err);
        }

        //if user exists than only solved problem
     
    }
    fetchProblems();
     if(user);
        fetchSolvedProblems();
},[user,page]);
// console.log(Problems)

//we will display filtered problems hence required its array

const filteredProblems=problems.filter(problems=>{
    const difficultyMatch=filter.difficulty==="all"||problems.difficulty===filter.difficulty;
    const tagMatch=filter.tag==="all"||filter.tag===problems.tags;
    const statusMatch=filter.status==="all"||solvedproblem.some(sp=>sp._id===problems._id);
    return difficultyMatch&&tagMatch&&statusMatch;
})
//required to display these problems ;

 //props obj for status
 const statusProp=[{data:"All Problems",value:"all"},{data:"Solved Problems",value:"solved"}];
 const difficultyProp=[{data:"Easy","value":"easy"},{data:"Medium",value:"medium"},{data:"Hard",value:"hard"}]
 const tagProp=[{data:"Array",value:"array"},{data:"Tree",value:"tree"},{data:"Maths",value:"maths"}];









  return (
    <div className='relative min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] font-sans text-white'>
        <Navbar/>
        {/* filters using these changing filter state hence filtered array */}
        <div className='flex justify-evenly pt-20 items-center '>   
           <Filter option={statusProp} field="status" state={{setFilter,filter}}/>
           <Filter option={difficultyProp} field="difficulty" state={{setFilter,filter}}/>
           <Filter option={tagProp} field="tag" state={{setFilter,filter}}/>
        </div>
          {/* simply displaying filteredProblems*/}
       <div className='flex justify-between items-center flex-col gap-5 mt-15'>
            {
                 filteredProblems.map((problem,i)=>{
                 return <ProblemCard key={i} solvedProblem={solvedproblem} problem={problem}/>
                     
                
               
                        
                })
            }

       </div>
           {/* pagination taki specific data load ho */}
        <div className=' absolute left-[45%] bottom-3'>
         <Pagination option={{page,setPage,totalPage}}/>
        </div>
        
    </div>
  )
}

export default Problems
