import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router';
import { Users, Code, Copy, Check, X, Loader2, Share2, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosClient from "../../utils/axiosClient";
import Submissionhistory from '../components/Submissionhistory';
import ChatAi from '../components/ChatAi';

const languages = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
];

function CollaborativeEditor() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user: reduxUser } = useSelector((state) => state.auth);
  
  // Helper function to get current user
  const getCurrentUser = (user) => {
    if (user) {
      return {
        id: user._id || user.id,
        firstName: user.firstName,
        imageUrl: user.profile?.url || null,
        isHost: false // Will be set after fetching session data
      };
    }
    return {
      id: `anon_${Math.random().toString(36).substring(7)}`,
      firstName: `Anonymous`,
      imageUrl: null,
      isHost: false
    };
  };
  
  const currentUser = getCurrentUser(reduxUser);

  // State variables
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [editorInstance, setEditorInstance] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [creatorName, setCreatorName] = useState('');
  const [problemDetails, setProblemDetails] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [testCaseResults, setTestCaseResults] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isHost, setIsHost] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1); // Track online users count

  // Refs
  const decorationsMapRef = useRef(new Map());
  const codeRef = useRef('');
  const ignoreChangeRef = useRef(false);
  const socketRef = useRef(null);
  const isResizing = useRef(false);
  const editorRef = useRef(null);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getBackendLanguage = (lang) => {
    if (lang === 'cpp') return 'c++';
    return lang;
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'failed':
        return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'passed':
        return <span className="badge badge-success text-white text-xs px-2 py-1">Passed</span>;
      case 'failed':
        return <span className="badge badge-error text-white text-xs px-2 py-1">Failed</span>;
      default:
        return <span className="badge badge-ghost text-xs px-2 py-1">Pending</span>;
    }
  };

  // Resizable panel handlers
  const handleMouseDown = useCallback((e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    setLeftPanelWidth(Math.min(80, Math.max(20, newWidth)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Remote cursor handling
  const updateRemoteCursor = useCallback((userId, position, selection) => {
    if (!editorInstance) return;

    const monaco = window.monaco;
    if (!monaco) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const user = collaborators.find(c => c.id === userId);
    const userFirstName = user?.firstName || 'Anonymous';
    const cursorColor = '#' + (parseInt(userId.substring(0, 8), 16) % 0xFFFFFF).toString(16).padStart(6, '0');

    let newDecorations = [];

    newDecorations.push({
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      options: {
        className: 'remote-cursor-line',
        glyphMarginClassName: 'remote-cursor-glyph',
        glyphMarginHoverMessage: { value: `${userFirstName}'s cursor` },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        overviewRuler: {
          color: cursorColor,
          darkColor: cursorColor,
          position: monaco.editor.OverviewRulerLane.Center
        }
      },
    });

    if (selection && !selection.isEmpty()) {
      newDecorations.push({
        range: new monaco.Range(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        ),
        options: {
          className: 'remote-selection',
          overviewRuler: {
            color: cursorColor + '80',
            darkColor: cursorColor + '80',
            position: monaco.editor.OverviewRulerLane.Center
          }
        },
      });
    }

    const oldDecorations = decorationsMapRef.current.get(userId) || [];
    const newDecorationIds = editorInstance.deltaDecorations(oldDecorations, newDecorations);
    decorationsMapRef.current.set(userId, newDecorationIds);
  }, [editorInstance, collaborators]);

  // Socket.io and data fetching
  useEffect(() => {
    const fetchAndConnect = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axiosClient.get(`/code/${sessionId}`);
        const data = response.data;

        setCode(data.codeContent);
        codeRef.current = data.codeContent;
        setLanguage(data.language);
        setCreatorName(data.creatorName);
        setProblemDetails(data.problemDetails);
        setIsHost(data.creatorId === currentUser.id);
        setOnlineUsers(data.activeUsersCount || 1); // Initialize with server count

        // Initialize test cases if available
        if (data.problemDetails?.visibleTestCases) {
          setTestCaseResults(data.problemDetails.visibleTestCases.map((testCase, index) => ({
            id: index,
            input: testCase.input,
            expectedOutput: testCase.output,
            explanation: testCase.explanation,
            actualOutput: null,
            status: 'pending',
            runtime: null,
            memory: null
          })));
        }

        const newSocket = io(`${import.meta.env.VITE_BACKEND_URL}/code`, {
          withCredentials: true,
          query: { sessionId: sessionId },
          auth: { sessionId: sessionId }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
          console.log('Connected to collaborative room:', sessionId);
          setError(null);
          newSocket.emit('user-join', currentUser);
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from collaborative room:', sessionId);
          if (editorInstance) {
            decorationsMapRef.current.forEach(decorations => {
              editorInstance.deltaDecorations(decorations, []);
            });
            decorationsMapRef.current.clear();
          }
        });

        newSocket.on('connect_error', (err) => {
          console.error('Connection Error:', err.message);
          setError(`Connection failed: ${err.message}.`);
        });

        // Handle user count updates from server
        newSocket.on('user-count-update', (count) => {
          setOnlineUsers(count);
        });

        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError(err.response?.data?.message || err.message || 'Could not load session.');
        setLoading(false);
      }
    };

    fetchAndConnect();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('user-leave', currentUser.id);
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !editorInstance) return;

    // Set initial code if different
    if (code && editorInstance.getValue() !== code) {
      ignoreChangeRef.current = true;
      editorInstance.setValue(code);
      ignoreChangeRef.current = false;
    }

    const handleCodeChange = (newCode) => {
      if (newCode !== editorInstance.getValue()) {
        ignoreChangeRef.current = true;
        editorInstance.setValue(newCode);
        setCode(newCode);
        codeRef.current = newCode;
        ignoreChangeRef.current = false;
      }
    };

    const handleLoadCode = (data) => {
      if (editorInstance && data.code !== editorInstance.getValue()) {
        ignoreChangeRef.current = true;
        editorInstance.setValue(data.code);
        setCode(data.code);
        codeRef.current = data.code;
        ignoreChangeRef.current = false;
      }
      setLanguage(data.language);
      setCollaborators(data.users || []);
    };

    const handleUserJoined = (user) => {
      console.log(`${user.firstName} joined`);
      setCollaborators(prev => [...prev.filter(u => u.id !== user.id), user]);
    };

    const handleUserLeft = (userId) => {
      console.log(`User ${userId} left`);
      setCollaborators(prev => prev.filter(u => u.id !== userId));
      if (decorationsMapRef.current.has(userId)) {
        editorInstance.deltaDecorations(decorationsMapRef.current.get(userId), []);
        decorationsMapRef.current.delete(userId);
      }
    };

    socket.on('load-code', handleLoadCode);
    socket.on('code-change', handleCodeChange);
    socket.on('cursor-change', (data) => {
      if (editorInstance && data.userId !== currentUser.id) {
        updateRemoteCursor(data.userId, data.position, data.selection);
      }
    });
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('code-error', (errMsg) => {
      setError(`Error: ${errMsg}`);
    });

    return () => {
      socket.off('load-code', handleLoadCode);
      socket.off('code-change', handleCodeChange);
      socket.off('cursor-change');
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('code-error');
    };
  }, [socket, editorInstance, currentUser.id, updateRemoteCursor]);

  // Editor handlers
  const handleEditorDidMount = (editor, monaco) => {
    setEditorInstance(editor);
    editorRef.current = editor;
    decorationsMapRef.current = new Map();

    editor.setValue(codeRef.current);

    editor.onDidChangeModelContent(() => {
      if (ignoreChangeRef.current) return;
      
      const updatedCode = editor.getValue();
      if (socket && socket.connected && updatedCode !== codeRef.current) {
        codeRef.current = updatedCode;
        setCode(updatedCode);
        socket.emit('code-change', updatedCode);
      }
    });

    editor.onDidChangeCursorPosition((e) => {
      if (socket && socket.connected) {
        socket.emit('cursor-change', {
          position: e.position,
          selection: editor.getSelection()
        });
      }
    });

    editor.onDidChangeCursorSelection((e) => {
      if (socket && socket.connected) {
        socket.emit('cursor-change', {
          position: editor.getPosition(),
          selection: e.selection
        });
      }
    });
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleLanguageChange = (e) => {
    
    const newLang = e.target.value;
    console.log(newLang)
    setLanguage(newLang);
    if (socket && socket.connected) {
      socket.emit('language-change', newLang);
    }
  };

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
  };

  // Code execution handlers
  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);

    try {
      const response = await axiosClient.post(`/submission/run/${problemDetails._id}`, {
        code,
        language: getBackendLanguage(language)
      });
      
      setRunResult(response.data);
      
      if (response.data.testCases && testCaseResults.length > 0) {
        const updatedTestCases = testCaseResults.map((testCase, index) => {
          const result = response.data.testCases[index];
          if (result) {
            return {
              ...testCase,
              actualOutput: result.stdout || result.output || '',
              status: result.status_id === 3 ? 'passed' : 'failed',
              runtime: result.time || response.data.runtime,
              memory: result.memory || response.data.memory,
              error: result.stderr || result.compile_output || null
            };
          }
          return testCase;
        });
        setTestCaseResults(updatedTestCases);
      }
      
      setLoading(false);
      setActiveLeftTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error',
        testCases: []
      });
      
      const errorTestCases = testCaseResults.map(testCase => ({
        ...testCase,
        status: 'failed',
        actualOutput: 'Error occurred',
        error: 'Internal server error'
      }));
      setTestCaseResults(errorTestCases);
      
      setLoading(false);
      setActiveLeftTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    if (!isHost) {
      alert('Only the session host can submit solutions');
      return;
    }

    setLoading(true);
    setSubmitResult(null);

    try {
      const response = await axiosClient.post(`/submission/submit/${problemDetails._id}`, {
        code: code,
        language: getBackendLanguage(language)
      });

      setSubmitResult(response.data);
      setLoading(false);
      setActiveLeftTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult({
        accepted: false,
        error: error.response?.data?.message || 'Internal server error',
        passedTestCases: 0,
        totalTestCases: 0
      });
      setLoading(false);
      setActiveLeftTab('result');
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/code/${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      alert('Failed to copy link. Please copy manually: ' + link);
    });
  };

  if (loading && !problemDetails) {
    return (
      <div className="flex bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-red-400 p-4 text-center">
        <X className="mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-lg">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-base-content overflow-hidden">
      {/* Left Panel */}
      <div className="flex flex-col border-r border-base-300 bg-white/5 backdrop-blur-md shadow-inner" style={{ width: `${leftPanelWidth}%` }}>
        {/* Left Tabs - Removed solutions and video solutions */}
        <div className="tabs tabs-lifted px-6 py-3 border-b border-base-300 flex justify-between items-center">
          <div className="flex">
            {['description', 'submissions', 'chatAI', 'testcase', 'result'].map((tab) => (
              <button
                key={tab}
                className={`tab transition duration-200 ease-in-out text-md tracking-wide font-medium px-4 ${activeLeftTab === tab ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary/80'}`}
                onClick={() => setActiveLeftTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Session ID: {sessionId.substring(0, 8)}</span>
            <button
              onClick={copyShareLink}
              className="btn btn-xs btn-ghost tooltip" data-tip="Copy session link"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {problemDetails && (
            <>
              {activeLeftTab === 'description' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-3xl font-extrabold text-primary-content drop-shadow-sm">{problemDetails.title}</h1>
                    <div className={`badge badge-outline px-3 py-1 text-sm ${getDifficultyColor(problemDetails.difficulty)}`}>
                      {problemDetails.difficulty}
                    </div>
                    <div className="badge badge-secondary px-3 py-1 text-sm">{problemDetails.tags}</div>
                  </div>

                  <div className="prose prose-sm max-w-none prose-p:text-base-content/80 whitespace-pre-wrap leading-relaxed">
                    {problemDetails.description}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Examples:</h3>
                    <div className="grid gap-4">
                      {problemDetails.visibleTestCases.map((example, index) => (
                        <div key={index} className="rounded-xl bg-base-200/60 p-5 border border-base-300 shadow-sm">
                          <h4 className="font-semibold text-base-content mb-2">Example {index + 1}:</h4>
                          <div className="space-y-1 font-mono text-xs">
                            <div><strong>Input:</strong> <pre className="inline bg-gray-800 p-1 rounded text-xs">{example.input}</pre></div>
                            <div><strong>Output:</strong> <pre className="inline bg-gray-800 p-1 rounded text-xs">{example.output}</pre></div>
                            {example.explanation && (
                              <div><strong>Explanation:</strong> <pre className="inline bg-gray-800 p-1 rounded text-xs">{example.explanation}</pre></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">My Submissions</h2>
                  <Submissionhistory problemId={problemDetails._id} />
                </div>
              )}

              {activeLeftTab === 'chatAI' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4">CHAT with AI</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <ChatAi problem={problemDetails}></ChatAi>
                  </div>
                </div>
              )}

              {activeLeftTab === 'testcase' && (
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-primary-content">Test Cases</h3>
                    {runResult && (
                      <div className="flex gap-2 text-sm">
                        <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                          Runtime: {runResult.runtime || 'N/A'} sec
                        </span>
                        <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                          Memory: {runResult.memory || 'N/A'} KB
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {testCaseResults.map((testCase, index) => (
                      <div
                        key={testCase.id}
                        className={`rounded-lg p-4 border shadow-sm transition-all duration-200 ${
                          testCase.status === 'passed' 
                            ? 'bg-green-900/20 border-green-700/50' 
                            : testCase.status === 'failed'
                            ? 'bg-red-900/20 border-red-700/50'
                            : 'bg-gray-700/20 border-gray-600/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-200 flex items-center gap-2">
                            {getStatusIcon(testCase.status)}
                            Test Case {index + 1}
                          </h4>
                          {getStatusBadge(testCase.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-300">
                          <div>
                            <strong className="text-blue-300">Input:</strong>
                            <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-x-auto">{testCase.input}</pre>
                          </div>
                          
                          <div>
                            <strong className="text-green-300">Expected Output:</strong>
                            <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-x-auto">{testCase.expectedOutput}</pre>
                          </div>
                          
                          {testCase.actualOutput !== null && (
                            <div>
                              <strong className={testCase.status === 'passed' ? 'text-green-300' : 'text-red-300'}>
                                Your Output:
                              </strong>
                              <pre className={`p-2 rounded mt-1 text-xs overflow-x-auto ${
                                testCase.status === 'passed' ? 'bg-green-900/30' : 'bg-red-900/30'
                              }`}>
                                {testCase.actualOutput || 'No output'}
                              </pre>
                            </div>
                          )}
                          
                          {testCase.explanation && (
                            <div>
                              <strong className="text-yellow-300">Explanation:</strong>
                              <p className="bg-gray-800 p-2 rounded mt-1 text-xs">{testCase.explanation}</p>
                            </div>
                          )}
                          
                          {testCase.error && (
                            <div>
                              <strong className="text-red-300">Error:</strong>
                              <pre className="bg-red-900/30 p-2 rounded mt-1 text-xs overflow-x-auto">{testCase.error}</pre>
                            </div>
                          )}
                          
                          {testCase.status !== 'pending' && (testCase.runtime || testCase.memory) && (
                            <div className="flex gap-4 mt-2 text-xs text-gray-400">
                              {testCase.runtime && <span>Runtime: {testCase.runtime} sec</span>}
                              {testCase.memory && <span>Memory: {testCase.memory} KB</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {testCaseResults.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No test cases available.</p>
                    </div>
                  )}
                  
                  {testCaseResults.every(tc => tc.status === 'pending') && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">Click "Run" to test your code with these test cases.</p>
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'result' && (
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-4 text-primary-content">Submission Result</h3>
                  {submitResult ? (
                    <div className={`rounded-lg p-4 shadow-md ${submitResult?.status==="accepted" ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                      <div className={`flex items-center gap-2 mb-3 ${submitResult?.status==="accepted" ? 'text-green-400' : 'text-red-400'}`}>
                        {submitResult?.status==="accepted" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        <span className="text-lg font-bold">{submitResult?.status==="accepted" ? 'Submission Accepted' : `${submitResult?.status?submitResult?.status:"Submission Failed"}`}</span>
                      </div>

                      <p className="text-sm text-gray-300 mb-4">
                        {submitResult?.status==="accepted"
                          ? 'Your solution has passed all the required test cases and meets the performance constraints.'
                          : submitResult.error || "Some test cases did not pass. Please review your logic or performance constraints."
                        }
                      </p>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        <div className="rounded-md bg-gray-700 px-3 py-1 shadow-inner">
                          <strong>Test Cases Passed:</strong> {submitResult.passedTestCases} / {submitResult.totalTestCases}
                        </div>
                        <div className="rounded-md bg-gray-700 px-3 py-1 shadow-inner">
                          <strong>Runtime:</strong> {submitResult.runtime || 'N/A'} sec
                        </div>
                        <div className="rounded-md bg-gray-700 px-3 py-1 shadow-inner">
                          <strong>Memory:</strong> {submitResult.memory || 'N/A'} KB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Click "Submit" to submit your solution for evaluation.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Resizable Divider */}
      <div
        className="w-2 bg-gray-700 cursor-ew-resize hover:bg-blue-500 transition-colors duration-100 flex items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex flex-col bg-base-100" style={{ width: `${100 - leftPanelWidth}%` }}>
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-base-100 border-b border-base-300">
            <div className="flex gap-4 items-center w-full justify-between">
              {/* Language Dropdown */}
              <div className="relative">
                <select
                  className="select select-sm bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>

              {/* Online Users - Now using the accurate count from server */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Users size={16} />
                  <span>{onlineUsers} Online</span>
                </div>
              </div>

              {/* Theme Dropdown */}
              <div className="relative">
                <select
                  className="select select-sm bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                  value={selectedTheme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                >
                  {['vs-dark', 'vs-light', 'hc-black', 'hc-light'].map((theme) => (
                    <option key={theme} value={theme}>
                      {theme.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 rounded-2xl border border-[#2c3e50] bg-[#0f172a] shadow-md overflow-hidden mx-4 mb-4">
            <Editor
              height="100%"
              language={getLanguageForMonaco(language)}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme={selectedTheme}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                readOnly: false,
                cursorStyle: 'line',
                mouseWheelZoom: true,
              }}
            />
          </div>
          
          <div className="bg-base-100 border-t border-base-300 flex justify-end p-4">
            <div className="flex gap-4">
              <button 
                className={`btn btn-outline btn-sm ${loading ? 'loading' : ''} border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200`} 
                onClick={handleRun} 
                disabled={loading}
              >
                Run
              </button>
              <button 
                className={`btn btn-primary btn-sm ${loading ? 'loading' : ''} bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 shadow-lg transition-all duration-200`} 
                onClick={handleSubmitCode} 
                disabled={loading || !isHost}
                title={!isHost ? "Only the session host can submit" : ""}
              >
                {isHost ? "Submit" : "Submit (Host Only)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollaborativeEditor;