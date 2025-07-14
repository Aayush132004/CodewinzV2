
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod/v4";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useEffect,useState } from 'react';
import { registerUser } from '../../authSlice';

const signupSchema=z
.object({
    firstName:z.string().min(2,"Name Should Contain atleast 2 character"),
    emailId:z.email("Invalid EmailId"),
    password:z.string().min(8,"Password Should Contain atleast 8 characters"),
    confirmPassword:z.string().min(8,"Confirm Password should contain at least 8 characters")
    

})
.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path:["confirmPassword"]
  });

function Signup(){

const dispatch=useDispatch();
const navigate=useNavigate();
const{isAuthenticated,loading,error}=useSelector((state)=>state.auth);

//eye icon for password and confirm pass
const [showPassword,setshowPassword]=useState("false");


//when form submit send to backend via register thunk
const onSubmit=(data) =>{
  dispatch(registerUser(data));
};

//once authenticated required to move to homepage hence this useEffect run only when authentication change and once initially
useEffect(()=>{
  if(isAuthenticated)
    navigate("/");
},[isAuthenticated]);

//using useForm hook for schema validation and form making 
const {register,handleSubmit,formState: { errors },} = useForm({resolver:zodResolver(signupSchema)});
 

 return (
  <>
    <div className="flex flex-col justify-center items-center min-h-screen p-4 bg-gradient-to-br from-[#0f172a] to-[#1e293b] font-sans text-white">
      <div className="w-full max-w-md space-y-5 bg-[#0f172a] p-8 rounded-2xl shadow-2xl border border-blue-800">

        {/* Header */}
        <h1 className="text-4xl font-bold text-center text-blue-400 tracking-wide">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse">
            CodeWinz
          </span>
        </h1>

        {/* Form starts here */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* First Name */}
          <div className="form-control w-full">
            <input
              {...register("firstName")}
              placeholder="Enter Your First Name"
              className={`input input-bordered w-full bg-[#1e293b] text-white placeholder-blue-300 ${
                errors.firstName ? "border-red-500" : "border-blue-700"
              }`}
            />
            {errors.firstName && (
              <span className="text-error text-sm mt-1">{errors.firstName.message}</span>
            )}
          </div>

          {/* Email ID */}
          <div className="form-control w-full">
            <input
              {...register("emailId")}
              placeholder="Enter Your Email ID"
              className={`input input-bordered w-full bg-[#1e293b] text-white placeholder-blue-300 ${
                errors.emailId ? "border-red-500" : "border-blue-700"
              }`}
            />
            {errors.emailId && (
              <span className="text-error text-sm mt-1">{errors.emailId.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-control w-full relative">
            <input
              {...register("password")}
              placeholder={showPassword ? "Enter Your Password" : "••••••••"}
              type={showPassword ? "text" : "password"}
              className={`input input-bordered w-full bg-[#1e293b] text-white placeholder-blue-300 ${
                errors.password ? "border-red-500" : "border-blue-700"
              }`}
            />
            {/* Toggle Eye */}
            <div
              className="absolute z-1 right-3 top-2 cursor-pointer text-blue-300 hover:text-blue-500"
              onClick={() => setshowPassword((prev) => !prev)}
            >
             {showPassword ? (
                  // Eye Open Icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  // Eye Off Icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.961 9.961 0 012.776-4.419M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18"
                    />
                  </svg>
                )}
            </div>
            {errors.password && (
              <span className="text-error text-sm mt-1">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-control w-full relative">
            <input
              {...register("confirmPassword")}
              placeholder={showPassword ? "Confirm Password" : "••••••••"}
              type={showPassword ? "text" : "password"}
              className={`input input-bordered w-full bg-[#1e293b] text-white placeholder-blue-300 ${
                errors.confirmPassword ? "border-red-500" : "border-blue-700"
              }`}
            />
            {/* Toggle Eye */}
            <div
              className="absolute z-1 right-3 top-2 cursor-pointer text-blue-300 hover:text-blue-500"
              onClick={() => setshowPassword((prev) => !prev)}
            >
              {showPassword ? (
                  // Eye Open Icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  // Eye Off Icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.961 9.961 0 012.776-4.419M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18"
                    />
                  </svg>
                )}
            </div>
            {errors.confirmPassword && (
              <span className="text-error text-sm mt-1">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit Button */}
            <div className="flex justify-center">
            <button
              type="submit"
              className={` ${loading?'loading loading-bars loading-sm text-accent':'btn btn-primary btn-block text-lg bg-blue-600 hover:bg-blue-700 text-white border-none transition-transform duration-200 ease-in-out hover:scale-105 active:scale-100'}`} disabled={loading}
            >
              Submit
            </button>
            </div>
        </form>

        {/* Sign In Link - OUTSIDE the form now */}
        <p className="text-center text-blue-100 mt-8">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="link link-info font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  </>
);


}

export default Signup