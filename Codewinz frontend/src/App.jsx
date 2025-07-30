
import { Routes, Route,Navigate } from "react-router";
import Homepage from "./pages/Homepage";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Problems from "./pages/Problems";
import Adminpanel from "./pages/Adminpanel";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "../authSlice";
import Profile from "./pages/Profile";
import ProblemPage from "./pages/ProblemPage";
import Admincreate from "./components/Admincreate";
import AdminDelete from "./components/AdminDelete";
import AdminUpdate from "./components/AdminUpdate";
import ProblemUpdate from "./components/ProblemUpdate";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";
import Setting from "./pages/Setting";
import Magic_Link from "./components/Magic_Link";
import CreateContest from "./pages/createContest";
import Contests from "./pages/Contests";
import ContestProblem from "./pages/ContestProblem"
import ContestProblemPage from "./pages/ContestProblemPage"
import ContestResult from "./pages/ContestResult"
import ContestSubmission from "./pages/ContestSubmission";
import CommunityChat from "./components/CommunityChat"
import CollaborativeEditor from "./components/CollaborativeEditor";
function App() {
  //code for check auth then redirect user to login or home direct req to call checkAuth extra reducer and then redirect 
 const {isAuthenticated,loading,user}=useSelector((state)=>state.auth);
 const dispatch=useDispatch();
//  console.log(user);
 useEffect(()=>{
  dispatch(checkAuth())
 },[dispatch])

 //a loader 
 if(loading)
 {
return (
  <div className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex flex-col items-center justify-center text-white font-mono relative overflow-hidden">
    
    {/* Glowing CodeWinz Text */}
    <div className="z-10 flex flex-col items-center text-center mb-12">
      <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse drop-shadow-lg">
        CodeWinz
      </h1>
      <p className="mt-4 text-blue-200 text-lg animate-fade-in tracking-wider">
        Booting your coding battlefield...
      </p>
    </div>

    {/* Large Green Rotating Loader Circle */}
    <div className="w-32 h-32 border-8 border-green-600 border-t-transparent rounded-full animate-spin-smooth opacity-40"></div>

    {/* Custom Animation */}
    <style>
      {`
        @keyframes spin-smooth {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-smooth {
          animation: spin-smooth 2s linear infinite;
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1.5s ease-in-out infinite alternate;
        }
      `}
    </style>
  </div>
);




 }
else{
  return (
    <>
      <Routes>
        <Route path='/' element={isAuthenticated?<Homepage />:<Navigate to="/Login"/>}></Route>
        {/* i am doing for my problem page */}
        <Route path='/Homepage/problems' element={isAuthenticated?<Problems />:<Navigate to="/Login"/>}></Route>
        {/* ////////////////////////////////////////// */}
        <Route path='/admin' element={isAuthenticated&&user?.role=='admin'?<Adminpanel/>:<Navigate to='/'/>}></Route>
        <Route path='/problem/:problemId' element={<ProblemPage/>}></Route>
        <Route path='/login' element={!isAuthenticated?<Login/>:<Navigate to='/'/>}></Route>
        <Route path='/signup' element={!isAuthenticated?<Signup/>:<Navigate to='/'/>}></Route>
        <Route path='/profile' element={isAuthenticated?<Profile />:<Navigate to='/'/>}></Route>
        <Route path='/admin/create' element={isAuthenticated&&user?.role=='admin'?<Admincreate/>:<Navigate to='/'/>}></Route>
         <Route path='/admin/delete' element={isAuthenticated&&user?.role=='admin'?<AdminDelete/>:<Navigate to='/'/>}></Route>
           <Route path='/admin/update' element={isAuthenticated&&user?.role=='admin'?<AdminUpdate/>:<Navigate to='/'/>}></Route>
          <Route path='/admin/update/:problemId' element={isAuthenticated&&user?.role=='admin'?<ProblemUpdate/>:<Navigate to='/'/>}></Route>
          <Route path='/admin/video' element={isAuthenticated&&user?.role=='admin'?<AdminVideo/>:<Navigate to='/'/>}></Route>
          <Route path='/admin/video/upload/:problemId' element={isAuthenticated&&user?.role=='admin'?<AdminUpload/>:<Navigate to='/'/>}></Route>
           <Route path='/setting' element={isAuthenticated?<Setting/>:<Navigate to='/'/>}></Route>
          <Route path='/magic-login/:token' element={<Magic_Link/>}> </Route>
          <Route path='/admin/createContest' element={isAuthenticated&&user?.role=='admin'?<CreateContest/>:<Navigate to='/'/>}> </Route>
        <Route path='/contests' element={isAuthenticated?<Contests/>:<Navigate to='/'/>}> </Route>
        <Route path='/contest/:id' element={isAuthenticated?<ContestProblem/>:<Navigate to='/'/>}> </Route>
        <Route path='/contestproblem/:contestId/:problemId' element={isAuthenticated?<ContestProblemPage/>:<Navigate to='/'/>}> </Route>
        <Route path='/contestResult/:contestId' element={isAuthenticated?<ContestResult/>:<Navigate to='/'/>}> </Route>
        <Route path='/contestStats/:contestId/:problemId' element={isAuthenticated?<ContestSubmission/>:<Navigate to='/'/>}> </Route>
         <Route path='/communitychat' element={isAuthenticated?<CommunityChat/>:<Navigate to='/'/>}> </Route>
          <Route path='/code/:sessionId' element={<CollaborativeEditor/>}> </Route>
        
      </Routes>
    </>
  )
}
}


export default App
