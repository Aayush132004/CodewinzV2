import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../authSlice";
import { Settings, LogOut, User, Shield, ChevronDown, Code2 } from "lucide-react";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    dispatch(logoutUser());
  };

  const navigateAndClose = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/30 shadow-lg' 
        : 'bg-slate-900/70 backdrop-blur-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          
          {/* Left: Enhanced Logo */}
          <div 
            onClick={() => navigate("/")} 
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              {user?.profile && (
                <img 
                  src="/logo.png" 
                  className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                  alt="Logo"
                />
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                CodeWinz
              </span>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Admin Panel Button */}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="group relative px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Admin Panel</span>
                </div>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-600/30 hover:border-cyan-400/60 transition-all duration-300 group shadow-lg hover:shadow-xl"
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full ring-2 ring-cyan-400/60 group-hover:ring-cyan-400 group-hover:ring-4 transition-all duration-300 overflow-hidden">
                    <img
                      alt="User Avatar"
                      src={user?.profile || '/default-avatar.png'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-white">{user?.firstName || 'User'}</div>
                  <div className="text-xs text-slate-300">{user?.email}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-4 w-80 bg-slate-800/95 backdrop-blur-xl border border-slate-600/40 rounded-2xl shadow-2xl z-20 overflow-hidden">
                    
                    {/* User Info Header */}
                    <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/40">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-full ring-2 ring-cyan-400/60 overflow-hidden">
                          <img
                            alt="User Avatar"
                            src={user?.profile || '/default-avatar.png'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">{user?.firstName || 'User'}</div>
                          <div className="text-sm text-slate-300">{user?.email}</div>
                          {user?.role && (
                            <div className="inline-flex items-center px-3 py-1 mt-2 text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 rounded-full border border-cyan-400/30">
                              {user.role}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => navigateAndClose('/profile')}
                        className="w-full flex items-center space-x-4 px-4 py-4 text-left hover:bg-slate-700/60 rounded-xl transition-all duration-300 group"
                      >
                        <div className="p-2.5 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/40 transition-all duration-300 group-hover:scale-110">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">Profile</div>
                          <div className="text-xs text-slate-400">Manage your account</div>
                        </div>
                      </button>

                      <button
                        onClick={() => navigateAndClose('/setting')}
                        className="w-full flex items-center space-x-4 px-4 py-4 text-left hover:bg-slate-700/60 rounded-xl transition-all duration-300 group"
                      >
                        <div className="p-2.5 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/40 transition-all duration-300 group-hover:scale-110">
                          <Settings className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">Settings</div>
                          <div className="text-xs text-slate-400">Preferences & privacy</div>
                        </div>
                      </button>

                      <div className="my-3 border-t border-slate-600/40"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-4 px-4 py-4 text-left hover:bg-red-500/20 rounded-xl transition-all duration-300 group"
                      >
                        <div className="p-2.5 bg-red-500/20 rounded-xl group-hover:bg-red-500/40 transition-all duration-300 group-hover:scale-110">
                          <LogOut className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-red-400 group-hover:text-red-300">Logout</div>
                          <div className="text-xs text-slate-400">Sign out of your account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
