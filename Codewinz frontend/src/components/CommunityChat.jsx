import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { Send, Settings, Users, MessageCircle, Palette, Moon, Sun, Zap, Hash, Smile, Paperclip, Search, MoreVertical, Star, Shield } from 'lucide-react';

// Function to get current user's basic info for displaying their own messages
const getCurrentUser = (user) => {
  if (user) {
    try {
      return {
        id: user._id || user.id,
        firstName: user.firstName,
        imageUrl: user.profile?.url
      };
    } catch (e) {
      console.error("Failed to get user data", e);
      return null;
    }
  }
  return null;
};

// Quick message templates
const quickMessages = [
  "👋 Hello everyone!",
  "🤔 Need help with a problem",
  "✅ Got it, thanks!",
  "🔥 Great solution!",
  "📚 Let's study together",
  "💡 I have an idea"
];

// Theme configurations
const themes = {
  cosmic: {
    name: 'Cosmic',
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-blue-500/20 to-purple-500/20',
    accent: 'text-blue-400',
    bg: 'bg-slate-900',
    cardBg: 'bg-slate-800/60',
    border: 'border-blue-500/30'
  },
  neon: {
    name: 'Neon',
    primary: 'from-cyan-500 to-emerald-500',
    secondary: 'from-cyan-500/20 to-emerald-500/20',
    accent: 'text-cyan-400',
    bg: 'bg-gray-900',
    cardBg: 'bg-gray-800/60',
    border: 'border-cyan-500/30'
  },
  sunset: {
    name: 'Sunset',
    primary: 'from-orange-500 to-pink-500',
    secondary: 'from-orange-500/20 to-pink-500/20',
    accent: 'text-orange-400',
    bg: 'bg-slate-900',
    cardBg: 'bg-slate-800/60',
    border: 'border-orange-500/30'
  },
  forest: {
    name: 'Forest',
    primary: 'from-green-600 to-teal-600',
    secondary: 'from-green-500/20 to-teal-500/20',
    accent: 'text-green-400',
    bg: 'bg-slate-900',
    cardBg: 'bg-slate-800/60',
    border: 'border-green-500/30'
  }
};

function PremiumCommunityChat() {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0); // This will now be directly from backend
  const [currentTheme, setCurrentTheme] = useState('cosmic');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]); // This will now be directly from backend
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const theme = themes[currentTheme];
  const currentUser = getCurrentUser(user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      withCredentials: true, 
      transports: ['websocket', 'polling']
    });

    // Socket.IO Event Listeners
    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to Socket.IO server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Socket.IO server');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO Connection Error:', err.message);
      setError(`Connection failed: ${err.message}. Please ensure you are logged in.`);
      setIsConnected(false);
    });

    // Listen for historical messages when connecting
    newSocket.on('load messages', (loadedMessages) => {
      setMessages(loadedMessages);
      scrollToBottom();
    });

    // Listen for new chat messages
    newSocket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
      scrollToBottom();
    });

    // Listen for chat errors from the server
    newSocket.on('chat error', (errMsg) => {
      setError(`Chat error: ${errMsg}`);
    });

    // Listen for online users count (from backend)
    newSocket.on('users count', (count) => {
      setActiveUsers(count);
    });

    // Listen for online users list (from backend)
    newSocket.on('online users', (users) => {
      setOnlineUsers(users);
      setActiveUsers(users.length); // Update activeUsers based on list length
    });

    setSocket(newSocket);

    // Clean up on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (newMessage.trim() && socket && isConnected) {
      socket.emit('chat message', newMessage.trim());
      setNewMessage('');
    } else if (!isConnected) {
      setError("Not connected to chat. Please wait or refresh.");
    }
  };

  const handleQuickMessage = (message) => {
    setNewMessage(message);
    setShowQuickMessages(false);
    inputRef.current?.focus();
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Removed todayMessages as it's no longer displayed
  // const todayMessages = messages.filter(msg => {
  //   const msgDate = new Date(msg.timestamp);
  //   const today = new Date();
  //   return msgDate.toDateString() === today.toDateString();
  // });

  return (
    <div className={`min-h-screen ${theme.bg} text-white relative overflow-hidden`}>
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.primary} opacity-10`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className={`absolute top-20 left-20 w-64 h-64 bg-gradient-to-r ${theme.primary} rounded-full blur-3xl opacity-20 animate-pulse`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r ${theme.primary} rounded-full blur-3xl opacity-15 animate-pulse delay-1000`}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className={`${theme.cardBg} z-3 backdrop-blur-xl rounded-2xl ${theme.border} border p-6 mb-6 shadow-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${theme.primary} shadow-lg`}>
                <MessageCircle className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Community Chat
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-sm text-gray-400">
                      {isConnected ? `${activeUsers} online` : 'Connecting...'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className={`${theme.accent} ${isConnected ? 'animate-pulse' : ''}`} size={16} />
                    <span className="text-sm text-gray-400">
                      {isConnected ? 'Real-time' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              
              {/* Theme Selector */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-xl ${theme.cardBg} ${theme.border} border hover:bg-gray-700/50  transition-all duration-200 relative`}
              >
                <Palette className={theme.accent} size={20} />
                {showSettings && (
                  <div className="absolute  top-14 right-0 bg-gray-800 rounded-xl p-4 shadow-2xl border border-gray-600/50 z-70 min-w-48">
                    <h3 className="text-white font-semibold mb-3">Choose Theme</h3>
                    <div className="space-y-2">
                      {Object.entries(themes).map(([key, themeData]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setCurrentTheme(key);
                            setShowSettings(false);
                          }}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-all ${
                            currentTheme === key ? 'bg-gray-700/70' : ''
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${themeData.primary}`}></div>
                          <span className="text-white">{themeData.name}</span>
                          {currentTheme === key && <Star className="text-yellow-400 ml-auto" size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Loading/Connecting Indicator */}
        {!isConnected && !error && (
          <div className="flex justify-center items-center h-64 mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin`}></div>
              <p className="text-lg text-gray-400">Connecting to chat...</p>
            </div>
          </div>
        )}

        {/* Main Chat Container */}
        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Messages */}
            <div className="lg:col-span-3">
              <div className={`${theme.cardBg} backdrop-blur-xl rounded-2xl ${theme.border} border shadow-2xl overflow-hidden h-[70vh] flex flex-col`}>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {filteredMessages.length === 0 && searchQuery && (
                    <div className="text-center text-gray-400 py-8">
                      No messages found for "{searchQuery}"
                    </div>
                  )}
                  
                  {filteredMessages.length === 0 && !searchQuery && (
                    <div className="text-center text-gray-400 py-8">
                      <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}

                  {filteredMessages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      className={`flex ${currentUser && msg.user?.id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-3 max-w-xs lg:max-w-md ${
                        currentUser && msg.user?.id === currentUser.id ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600/50 shadow-lg">
                            {msg.user?.imageUrl ? (
                              <img
                                src={msg.user.imageUrl}
                                alt={msg.user.firstName || 'User'}
                                className="w-full h-full object-cover"
                                onError={(e) => { 
                                  e.target.onerror = null; 
                                  e.target.src = `https://placehold.co/40x40/CCCCCC/000000?text=${msg.user?.firstName ? msg.user.firstName.charAt(0).toUpperCase() : 'U'}`; 
                                }}
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-r ${theme.primary} flex items-center justify-center text-white font-bold`}>
                                {msg.user?.firstName ? msg.user.firstName.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex flex-col ${currentUser && msg.user?.id === currentUser.id ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-300">
                              {msg.user?.firstName || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <div className={`rounded-2xl px-4 py-2 shadow-lg ${
                            currentUser && msg.user?.id === currentUser.id
                              ? `bg-gradient-to-r ${theme.primary} text-white`
                              : 'bg-gray-700/70 text-white border border-gray-600/30'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-700/50 p-4">
                  {/* Quick Messages */}
                  {showQuickMessages && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {quickMessages.map((msg, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickMessage(msg)}
                          className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-sm rounded-full border border-gray-600/30 transition-all duration-200 hover:scale-105"
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowQuickMessages(!showQuickMessages)}
                      className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                    >
                      <Zap className={`${theme.accent} ${showQuickMessages ? 'animate-pulse' : ''}`} size={20} />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-12"
                        disabled={!isConnected}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-700/50 p-1 rounded"
                      >
                        <Smile className="text-gray-400" size={18} />
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                      className={`p-3 rounded-xl bg-gradient-to-r ${theme.primary} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
                    >
                      <Send className="text-white" size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar (Online Users) */}
            <div className="lg:col-span-1 -z-1 space-y-6"> {/* Adjusted col-span for sidebar */}
              {/* Online Users */}
              <div className={`${theme.cardBg} backdrop-blur-xl rounded-2xl ${theme.border} border p-6 shadow-2xl`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Users className={theme.accent} size={20} />
                  <h3 className="text-lg font-semibold text-white">Online Now</h3>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">{activeUsers}</span>
                </div>
                <div className="space-y-3">
                  {onlineUsers.length > 0 ? (
                    onlineUsers.slice(0, 5).map((onlineUser, index) => (
                      <div key={onlineUser.id || index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/30 transition-all">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            {onlineUser.imageUrl ? (
                              <img src={onlineUser.imageUrl} alt={onlineUser.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-r ${theme.primary} flex items-center justify-center text-white text-xs font-bold`}>
                                {onlineUser.firstName ? onlineUser.firstName.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{onlineUser.firstName || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400 truncate">Online</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No online users data</p>
                    </div>
                  )}
                  {onlineUsers.length > 5 && (
                    <button className="w-full text-center text-sm text-gray-400 hover:text-white py-2 transition-colors">
                      View all {activeUsers} users
                    </button>
                  )}
                </div>
              </div>

              {/* Removed Chat Stats / Today's Activity Tab */}
              {/*
              <div className={`${theme.cardBg} backdrop-blur-xl rounded-2xl ${theme.border} border p-6 shadow-2xl`}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Hash className={theme.accent} size={20} />
                  <span>Today's Activity</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Messages</span>
                    <span className="text-white font-bold">{todayMessages.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Users</span>
                    <span className="text-white font-bold">{activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Messages</span>
                    <span className="text-white font-bold">{messages.length}</span>
                  </div>
                </div>
              </div>
              */}
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </div>
  );
}

export default PremiumCommunityChat;
