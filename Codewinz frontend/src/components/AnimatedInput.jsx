// AnimatedInput.jsx - Fixed alignment issues

import React, { useState, useRef, useEffect } from 'react';
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

  // Check if input has value on mount and during changes
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      // Check initial value
      setHasValue(input.value.length > 0);
      
      const handleInput = () => {
        const currentValue = input.value;
        setHasValue(currentValue.length > 0);
      };
      
      // Listen for input, change, and keyup events to catch all value changes
      input.addEventListener('input', handleInput);
      input.addEventListener('change', handleInput);
      input.addEventListener('keyup', handleInput);
      
      return () => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('change', handleInput);
        input.removeEventListener('keyup', handleInput);
      };
    }
  }, []);

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    // Force check the actual input value when blurring
    const currentValue = e.target.value;
    setHasValue(currentValue.length > 0);
  };

  // Determine if label should be in "up" position
  const labelUp = isFocused || hasValue;

  return (
    <div className="relative group">
      {/* Container for animated effects and input */}
      <div className={`relative transition-all duration-500 rounded-2xl ${isFocused ? 'scale-[1.02]' : ''}`}>
        
        {/* Animated background glow */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-500 ${isFocused ? 'opacity-100' : ''}`} />

        {/* The main input container with relative positioning for elements */}
        <div className="relative z-10">
          
          {/* Floating label - Fixed positioning with better transition */}
          <label className={`absolute transition-all duration-300 ease-in-out pointer-events-none z-20 transform-gpu ${
            labelUp
              ? 'top-2 text-xs text-blue-400 font-semibold translate-y-0 scale-100'
              : 'top-1/2 text-base -translate-y-1/2 text-gray-400 scale-100'
          } ${icon ? (labelUp ? 'left-4' : 'left-12') : 'left-4'}`}>
            {label}
          </label>
          
          {/* Icon, positioned to the left */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-20">
              {icon}
            </div>
          )}
          
          {/* Main input field - Improved event handling */}
          <input
            ref={inputRef}
            {...register}
            type={inputType}
            placeholder={isFocused ? placeholder : ''}
            className={`w-full ${icon ? 'pl-12' : 'pl-4'} ${showPasswordToggle ? 'pr-12' : 'pr-4'} ${
              labelUp ? 'pt-8 pb-2' : 'pt-6 pb-2'
            } bg-slate-800/50 border-2 rounded-2xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm focus:outline-none relative z-10 ${
              error
                ? 'border-red-500/50 focus:border-red-400'
                : isFocused
                  ? 'border-blue-500/50 focus:border-blue-400'
                  : 'border-slate-600/30 hover:border-slate-500/50'
            }`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onInput={(e) => {
              // Handle immediate value changes
              const currentValue = e.target.value || '';
              setHasValue(currentValue.trim().length > 0);
              // Call register's onInput if it exists
              if (register?.onChange) {
                register.onChange(e);
              }
            }}
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

export default AnimatedInput;