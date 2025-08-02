import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { Users, Copy, Check, AlertCircle } from 'lucide-react';

const CollaborativeEditor = () => {
  const { sessionId } = useParams();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [collaborators, setCollaborators] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [creatorName, setCreatorName] = useState('');
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const isUpdatingFromSocket = useRef(false);
  const typingTimeoutRef = useRef(null);
  const lastCodeRef = useRef('');

  // Debounced code change handler to prevent flickering
  const debouncedCodeChange = useCallback((newCode) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && newCode !== lastCodeRef.current) {
        socketRef.current.emit('code-change', newCode);
        lastCodeRef.current = newCode;
      }
    }, 300); // 300ms debounce
  }, []);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(`${import.meta.env.VITE_API_URL}/code`, {
      query: { sessionId },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Connected to collaborative session');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from collaborative session');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(`Connection failed: ${err.message}`);
      setIsConnected(false);
    });

    // Load initial code and session data
    socket.on('load-code', (data) => {
      console.log('Loading initial code:', data);
      setCode(data.code || '');
      setLanguage(data.language || 'javascript');
      setCreatorName(data.creatorName || 'Unknown');
      lastCodeRef.current = data.code || '';
    });

    // Handle collaborators updates
    socket.on('collaborators-update', (data) => {
      console.log('Collaborators update:', data);
      setCollaborators(data.users || []);
    });

    // Handle code changes from other users
    socket.on('code-change', (newCode) => {
      console.log('Received code change from another user');
      isUpdatingFromSocket.current = true;
      setCode(newCode);
      lastCodeRef.current = newCode;
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingFromSocket.current = false;
      }, 100);
    });

    // Handle language changes
    socket.on('language-change', (newLanguage) => {
      console.log('Language changed to:', newLanguage);
      setLanguage(newLanguage);
    });

    // Handle user join/leave events
    socket.on('user-joined', (user) => {
      console.log('User joined:', user);
    });

    socket.on('user-left', (userId) => {
      console.log('User left:', userId);
      // Remove from typing users if they were typing
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Handle typing indicators
    socket.on('user-typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    // Handle errors
    socket.on('code-error', (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [sessionId]);

  const handleEditorChange = (value) => {
    if (isUpdatingFromSocket.current) {
      return; // Don't emit changes that came from socket
    }
    
    setCode(value || '');
    debouncedCodeChange(value || '');
    
    // Emit typing indicator
    if (socketRef.current) {
      socketRef.current.emit('user-typing', { isTyping: true });
      
      // Clear typing indicator after 2 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('user-typing', { isTyping: false });
        }
      }, 2000);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (socketRef.current) {
      socketRef.current.emit('language-change', newLanguage);
    }
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/code/${sessionId}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      case 'python': return 'python';
      default: return 'javascript';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Collaborative Code Editor</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Collaborators */}
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span className="text-sm">{collaborators.length} online</span>
              <div className="flex -space-x-2">
                {collaborators.slice(0, 5).map((user, index) => (
                  <div
                    key={user.socketId || index}
                    className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold border-2 border-gray-800"
                    title={user.firstName}
                  >
                    {user.firstName.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold border-2 border-gray-800">
                    +{collaborators.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            {Array.from(typingUsers).map(userId => {
              const user = collaborators.find(c => c.id === userId);
              return user?.firstName;
            }).filter(Boolean).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>

      {/* Editor controls */}
      <div className="bg-gray-800 border-b border-gray-700 p-2">
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
          >
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
          </select>
          
          <span className="text-sm text-gray-400">
            Created by: {creatorName}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguageForMonaco(language)}
          value={code}
          onChange={handleEditorChange}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            mouseWheelZoom: true,
          }}
        />
      </div>
    </div>
  );
};

export default CollaborativeEditor;