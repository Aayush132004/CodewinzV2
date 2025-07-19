import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { loginUser } from "../../authSlice";
import Googlelogin from "../components/Googlelogin"
import axiosClient from "../../utils/axiosClient";

const signupSchema = z.object({
  emailId: z.email("Invalid EmailId"),
  password: z.string().min(8, "Password Should Contain atleast 8 characters"),
});



function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mailerror,setMailerror]=useState(null);
  const [timer,setTimer]=useState(0);

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  //once login redirecting to home
  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated]);

  //on submit sending data to server
  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });
  //for mananging password eye svg state ke through input field ka type change krunga on button click
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4 font-sans text-white">
        <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-2xl p-8 space-y-6 border border-blue-800">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-black text-blue-400 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse">
                CodeWinz
              </span>
            </h1>
            <p className="text-base text-blue-100">
              Welcome back! Please login to your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-white">Email ID</span>
              </label>
              <input
                {...register("emailId")}
                placeholder="you@codewinz.com"
                className="input input-bordered w-full focus:input-primary transition-all duration-300 bg-[#1e293b] border-blue-700 text-white placeholder-blue-300"
              />
              {errors.emailId && (
                <span className="text-red-500 text-sm mt-2">
                  {errors.emailId.message}
                </span>
              )}
            </div>

            {/* Password Input */}

            <div className="form-control w-full relative">
              <label className="label">
                <span className="label-text text-white">Password</span>
              </label>
              <div className="relative">
                 <input
                {...register("password")}
                placeholder={showPassword ? "Password" : "••••••••"}
                type={showPassword ? "text" : "password"}
                className="input input-bordered w-full pr-12 focus:input-primary transition-all duration-300 bg-[#1e293b] border-blue-700 text-white placeholder-blue-300"
              />
              <div
                className="absolute  z-1 inset-y-0 right-3 top-2 flex items-center cursor-pointer text-blue-300 hover:text-blue-500 transition"
                onClick={() => setShowPassword((prev) => !prev)}
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
              </div>
             
              {/* Toggle Eye Icon */}

              {errors.password && (
                <span className="text-red-500 text-sm mt-2">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
            <button
              type="submit"
              className={` ${loading?'loading loading-bars loading-sm text-accent':'btn btn-primary btn-block text-lg bg-blue-600 hover:bg-blue-700 text-white border-none transition-transform duration-200 ease-in-out hover:scale-105 active:scale-100'}`} disabled={loading}
            >
              Login
            </button>
            </div>
            
          </form>

          {/* Divider */}
          <div className="divider text-blue-200 my-6">OR CONTINUE WITH</div>

          {/* Social Logins */}
          <div className="flex justify-center items-center gap-4">
         

            <Googlelogin/>
            {/* <button className="btn btn-circle btn-outline border-blue-500 hover:bg-blue-600 hover:border-blue-600 transition-all duration-300"> */}
              {/* Mail */}
              <button  disabled={loading} onClick={()=>document.getElementById('my_modal_3').showModal()} className="btn btn-circle btn-outline border-blue-500 hover:bg-red-500 hover:border-red-500 transition-all duration-300">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h16a2 2 0 012 2v1.5l-10 6.5-10-6.5V6a2 2 0 012-2zm0 4.75l10 6.5 10-6.5V18a2 2 0 01-2 2H6a2 2 0 01-2-2V8.75z" />
              </svg>
              </button>
               <dialog id="my_modal_3" className="modal">
  <div className="modal-box">
    <button
      type="button"
      className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      onClick={() => document.getElementById("my_modal_3").close()}
    >
      ✕
    </button>

    <p className="mb-4">Enter Your Registered Gmail ID</p>

    <form onSubmit={async (e)=>{
      e.preventDefault();
      // alert(e.target[0].value);
      // console.log(e);
      const data=e.target[0].value;
    try{
         setTimer(60);
     const interval= setInterval(() => {
      setTimer((prev)=>{
        if(prev===0){
          clearInterval(interval);
          return 0;
        }
       else{
        return prev-1;
       }
      });
     
        
    }, 1000);
    
     const res= await axiosClient.post("/user/mailLogin",{emailId:data});
     console.log(res);
    }
    catch(err){
      console.log(err);
       setMailerror(err.response.data.message);
    }

     
      //on submitting send to backend there check if already registered or not 0
    }}>
      <input
        type="email" required
        className="input input-bordered w-full mb-4"
        placeholder="Enter your Gmail ID"
      />
      <div className="flex flex-col">
      {mailerror&&<span className="text-red-500 text-sm mt-2">
                  {mailerror}
        </span>}
      <button type="submit" disabled={timer===0?false:true} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white ">{timer===0?'Send Link':'Link Send!You Can Try Again in '+timer+'sec'}</button>
      </div>
    </form>
  </div>
</dialog>

            
          
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-blue-100 mt-8 ">
            Don’t have an account?{" "}
            <div className="flex flex-col">
            <button onClick={()=>{navigate('/signup')}} className="link link-info font-semibold">
              Sign up
            </button>
            {error&&(
                <span className="text-red-500 text-sm mt-2">
                  {error}
                </span>
               
              )}
              </div>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;
