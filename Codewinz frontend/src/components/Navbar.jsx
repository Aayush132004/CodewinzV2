import React from 'react'
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from "react-redux"
import { logoutUser } from "../../authSlice";
import { Settings ,LogOut} from "lucide-react";

const Navbar = () => {
     const dispatch=useDispatch();
     const navigate=useNavigate();
     const {isAuthenticated,user}=useSelector((state)=>state.auth)
    //  console.log("user",user.profile)
  return (
      <div className=" fixed top-0 mb navbar px-10 py-4 bg-slate-800 shadow-md min-h-[72px] text-white">
        {/* Left: Site Name */}
        <div className="flex-1">
          <div className='flex'>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            CodeWinz
          </span>
          <img src="/logo.png" className="h-10 w-15 object-cover"/>
          </div>
          
        </div>

        {/* Right: Profile Avatar + Dropdown */}
        <div className="flex gap-4 items-center">

          {/* Profile Dropdown */}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar hover:scale-105 transition-transform duration-150"
            >
              <div className="w-12 rounded-full ring ring-cyan-400 ring-offset-slate-800 ring-offset-2">
                <img
                  alt="User Avatar"
                  src={user.profile}
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-md dropdown-content mt-4 z-[10] w-60 p-3 shadow-xl bg-slate-900 text-white rounded-xl space-y-1"
            >
              <li>
                <button onClick={()=>{navigate('/profile')}} className="font-medium"> Profile</button>
              </li>
              <li>
                <a onClick={()=>{navigate('/setting')}} className="font-medium flex items-center gap-2">
                  <Settings size={18} /> Settings
                </a>
              </li>
              <li>
                <button onClick={()=>{dispatch(logoutUser())}} className="font-medium flex items-center gap-2 text-red-400 hover:text-red-500">
                  <LogOut size={18} /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
  )
}

export default Navbar
