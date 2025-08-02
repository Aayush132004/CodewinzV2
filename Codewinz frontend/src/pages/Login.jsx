// AnimatedInput.jsx - Corrected component

import { Eye, EyeOff } from 'lucide-react';

function AnimatedInput({
  label,
  type = 'text',
  placeholder,
  register,
  error,
  showPasswordToggle = false,
  icon
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  // Handles checking if the input has a value to control the floating label
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      const handleInput = () => setHasValue(input.value.length > 0);
      input.addEventListener('input', handleInput);
      return () => input.removeEventListener('input', handleInput);
    }
  }, []);

  return (
    <div className="relative group">
      {/* Container for animated effects and input */}
      <div className={`relative transition-all duration-500 rounded-2xl ${isFocused ? 'scale-[1.02]' : ''}`}>
        
        {/* Animated background glow */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-500 ${isFocused ? 'opacity-100' : ''}`} />

        {/* The main input container with relative positioning for elements */}
        <div className="relative z-10">
          
          {/* Floating label */}
          <label className={`absolute transition-all duration-300 pointer-events-none z-20 transform ${
            isFocused || hasValue
              ? 'top-2 text-xs text-blue-400 font-semibold'
              : 'top-1/2 text-base -translate-y-1/2 text-gray-400'
          } ${icon ? 'left-12' : 'left-4'}`}>
            {label}
          </label>
          
          {/* Icon, positioned to the left */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-20">
              {icon}
            </div>
          )}
          
          {/* Main input field that is now guaranteed to be on top */}
          <input
            ref={inputRef}
            {...register}
            type={inputType}
            placeholder={isFocused && !hasValue ? placeholder : ''}
            className={`w-full ${icon ? 'pl-12' : 'pl-4'} ${showPasswordToggle ? 'pr-12' : 'pr-4'} pt-6 pb-2 bg-slate-800/50 border-2 rounded-2xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm focus:outline-none relative z-10 ${
              error
                ? 'border-red-500/50 focus:border-red-400'
                : isFocused
                  ? 'border-blue-500/50 focus:border-blue-400'
                  : 'border-slate-600/30 hover:border-slate-500/50'
            }`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          
          {/* Password toggle button */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-200 z-20"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        
        {/* Animated border */}
        <div className={`absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity duration-300 ${isFocused ? 'opacity-100' : ''}`} style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'xor' }} />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-red-400 text-sm font-medium animate-pulse">
          {error}
        </div>
      )}
    </div>
  );
}

// Login.jsx - Your main component, now using the corrected AnimatedInput
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { Mail, Lock, Sparkles, Shield, Zap, ArrowRight } from 'lucide-react';
import Googlelogin from '../components/Googlelogin';
import axiosClient from '../../utils/axiosClient';
import AuthBackground from '../components/AuthBackground';
import AnimatedButton from '../components/AnimatedButton';
import FloatingCard from '../components/FloatingCard';
import { loginUser } from '../../authSlice';

// The validation schema is still Zod, which is a JS library
const signupSchema = z.object({
  emailId: z.string().email('Invalid EmailId'),
  password: z.string().min(8, 'Password Should Contain atleast 8 characters'),
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mailerror, setMailerror] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const handleMailLogin = async (e) => {
    e.preventDefault();
    const data = e.target[0].value;
    try {
      setTimer(60);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 0) {
            clearInterval(interval);
            return 0;
          } else {
            return prev - 1;
          }
        });
      }, 1000);

      const res = await axiosClient.post('/user/mailLogin', { emailId: data });
      console.log(res);
    } catch (err) {
      console.log(err);
      setMailerror(err.response.data.message);
    }
  };

  return (
    <>
      <AuthBackground />
      <div className="min-h-screen flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
        {/* Floating elements */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60" />
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40" />
          <div className="absolute bottom-32 left-40 w-3 h-3 bg-cyan-400 rounded-full animate-bounce opacity-30" />
          <div className="absolute bottom-20 right-20 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-50" />
        </div>

        <div className="w-full max-w-md z-20 relative">
          <FloatingCard className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="p-10 space-y-8">
              {/* Header */}
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
                  <img
                    src="/logo.png"
                    className="h-32 object-cover relative z-10 hover:scale-110 transition-transform duration-500"
                    alt="CodeWinz Logo"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 backdrop-blur-sm">
                    <Shield className="w-4 h-4 text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-blue-300">Secure Login</span>
                    <Sparkles className="w-4 h-4 text-purple-400 ml-2 animate-pulse" />
                  </div>
                  
                  <h1 className="text-4xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                    Welcome Back
                  </h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Continue your journey to coding excellence
                  </p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <AnimatedInput
                 
                  type="email"
                  placeholder="Enter your email"
                  register={register('emailId')}
                  error={errors.emailId?.message}
                  icon={<Mail size={20} />}
                />

                <AnimatedInput
                 
                  type="password"
                  placeholder="Enter your password"
                  register={register('password')}
                  error={errors.password?.message}
                  showPasswordToggle={true}
                  icon={<Lock size={20} />}
                />

                <AnimatedButton
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="w-full group"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </AnimatedButton>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center animate-pulse">
                    {error}
                  </div>
                )}
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900/50 text-gray-400 backdrop-blur-sm rounded-full">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Logins */}
              <div className="flex justify-center items-center gap-4">
                <Googlelogin />
                
                <button
                  disabled={loading}
                  onClick={() => document.getElementById('my_modal_3').showModal()}
                  className="group relative p-4 bg-slate-800/50 hover:bg-red-500/20 border border-slate-600/50 hover:border-red-500/50 rounded-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Mail className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition-colors duration-300 relative z-10" />
                </button>

                {/* Enhanced Modal */}
                <dialog id="my_modal_3" className="modal">
                  <div className="modal-box bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl">
                    <button
                      type="button"
                      className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-white"
                      onClick={() => document.getElementById('my_modal_3').close()}
                    >
                      ✕
                    </button>

                    <div className="space-y-6 pt-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Magic Link Login</h3>
                        <p className="text-gray-400">Enter your registered email to receive a login link</p>
                      </div>

                      <form onSubmit={handleMailLogin} className="space-y-4">
                        <AnimatedInput
                          label="Email Address"
                          type="email"
                          placeholder="Enter your registered email"
                          register={{ required: true }}
                          icon={<Mail size={20} />}
                        />
                        
                        {mailerror && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {mailerror}
                          </div>
                        )}
                        
                        <AnimatedButton
                          type="submit"
                          disabled={timer > 0}
                          variant="primary"
                          size="lg"
                          className="w-full"
                        >
                          {timer === 0 ? 'Send Magic Link' : `Resend in ${timer}s`}
                        </AnimatedButton>
                      </form>
                    </div>
                  </div>
                </dialog>
              </div>

              {/* Sign Up Link */}
              <div className="text-center space-y-4">
                <p className="text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/signup')}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300 hover:underline"
                  >
                    Create Account
                  </button>
                </p>
                
                {/* Trust indicators */}
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Fast</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Trusted</span>
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </>
  );
}

export default Login;
