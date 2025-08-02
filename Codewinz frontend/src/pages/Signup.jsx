import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { User, Mail, Lock, Sparkles, Shield, Zap, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { registerUser } from '../../authSlice';
import AuthBackground from '../components/AuthBackground';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import FloatingCard from '../components/FloatingCard';

const signupSchema = z
  .object({
    firstName: z.string().min(2, 'Name Should Contain atleast 2 character'),
    emailId: z.string().email('Invalid EmailId'),
    password: z.string().min(8, 'Password Should Contain atleast 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm Password should contain at least 8 characters')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords don\'t match',
    path: ['confirmPassword']
  });

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const benefits = [
    { icon: CheckCircle, text: 'Access to 10,000+ coding problems' },
    { icon: Star, text: 'AI-powered personalized learning' },
    { icon: Shield, text: 'Join elite developer community' },
    { icon: Zap, text: 'Real-time coding competitions' }
  ];

  return (
    <>
      <AuthBackground />
      <div className="min-h-screen flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
        {/* Floating elements */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-32 left-16 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60" />
          <div className="absolute top-20 right-24 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40" />
          <div className="absolute bottom-40 left-32 w-3 h-3 bg-cyan-400 rounded-full animate-bounce opacity-30" />
          <div className="absolute bottom-24 right-16 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-50" />
          <div className="absolute top-1/2 left-8 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-30" />
        </div>

        <div className="w-full max-w-md z-20 relative">
          <FloatingCard className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="p-10 space-y-8">
              {/* Header */}
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
                  <img
                    src="/logo.png"
                    className="h-32 object-cover relative z-10 hover:scale-110 transition-transform duration-500"
                    alt="CodeWinz Logo"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full border border-purple-500/30 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-purple-400 mr-2 animate-pulse" />
                    <span className="text-sm font-medium text-purple-300">Join Elite Coders</span>
                    <Star className="w-4 h-4 text-blue-400 ml-2" />
                  </div>
                  
                  <h1 className="text-4xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
                    Start Your Journey
                  </h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Join thousands of developers mastering their craft
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 hover:scale-105 group"
                  >
                    <benefit.icon className="w-4 h-4 text-blue-400 group-hover:text-purple-400 transition-colors duration-300" />
                    <span className="text-xs text-gray-300 group-hover:text-white transition-colors duration-300">
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <AnimatedInput
                  label="First Name"
                  type="text"
                  placeholder="Enter your first name"
                  register={register('firstName')}
                  error={errors.firstName?.message}
                  icon={<User size={20} />}
                />

                <AnimatedInput
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  register={register('emailId')}
                  error={errors.emailId?.message}
                  icon={<Mail size={20} />}
                />

                <AnimatedInput
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  register={register('password')}
                  error={errors.password?.message}
                  showPasswordToggle={true}
                  icon={<Lock size={20} />}
                />

                <AnimatedInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  register={register('confirmPassword')}
                  error={errors.confirmPassword?.message}
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
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </AnimatedButton>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center animate-pulse">
                    {error}
                  </div>
                )}
              </form>

              {/* Sign In Link */}
              <div className="text-center space-y-4">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300 hover:underline"
                  >
                    Sign In
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
                    <span>Fast Setup</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Free Forever</span>
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

export default Signup;
