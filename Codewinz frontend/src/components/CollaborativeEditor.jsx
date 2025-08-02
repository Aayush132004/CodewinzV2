import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router';
import { Users, Code, Copy, Check, X, Loader2, Share2, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosClient from "../../utils/axiosClient";
import Submissionhistory from '../components/Submissionhistory';
import ChatAi from '../components/ChatAi';

const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
];

const themes = [
    'vs-dark',
    'vs-light',
    'hc-black',
    'hc-light'
];

function CollaborativeEditor() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user: reduxUser } = useSelector((state) => state.auth);

    // --- State Management ---
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [selectedTheme, setSelectedTheme] = useState('vs-dark');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [collaborators, setCollaborators] = useState([]);
    const [creatorId, setCreatorId] = useState(''); 
    const [creatorName, setCreatorName] = useState(''); 
    const [problemDetails, setProblemDetails] = useState(null);
    const [activeLeftTab, setActiveLeftTab] = useState('description');
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [testCaseResults, setTestCaseResults] = useState([]);
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Refs for managing state without re-renders ---
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const socketRef = useRef(null);
    const ignoreChangeRef = useRef(false);
    const codeRef = useRef('');
    const hasJoinedRef = useRef(false);
    const typingTimeoutRef = useRef(null);
    const decorationsMapRef = useRef(new Map());
    const currentUserRef = useRef(null);

    // Memoize current user to prevent infinite re-renders
    const currentUser = React.useMemo(() => {
        if (reduxUser && reduxUser._id) {
            const user = {
                id: reduxUser._id,
                firstName: reduxUser.firstName || 'User',
                imageUrl: reduxUser.profile?.url || null,
            };
            // console.log('Logged in user from Redux:', user);
            currentUserRef.current = user;
            return user;
        }
        let anonId = localStorage.getItem('anonUserId');
        if (!anonId) {
            anonId = `anon_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('anonUserId', anonId);
        }
        const user = {
            id: anonId,
            firstName: `Guest${anonId.substring(5, 9)}`, // More descriptive anonymous name
            imageUrl: null,
        };
        // console.log('Anonymous user created:', user);
        currentUserRef.current = user;
        return user;
    }, [reduxUser]);

    const isHost = creatorId === currentUser.id;

    // Fixed language mapping functions
    const getLanguageForMonaco = (lang) => {
        const languageMap = {
           'cpp': 'cpp',
         'c++': 'cpp',  // Backend sends 'c++', Monaco expects 'cpp'   // Handle both cases
             'java': 'java',
             'javascript': 'javascript'
         };
         return languageMap[lang] || 'javascript';
    };

    const getBackendLanguage = (lang) => {
        const backendMap = {
             'cpp': 'c++',
             'java': 'java',
             'javascript': 'javascript'
         };
         return backendMap[lang] || 'javascript';
    };

    // NEW: Function to convert backend language format to frontend format
    const getFrontendLanguage = (backendLang) => {
        const frontendMap = {
            'c++': 'cpp',
            'java': 'java',
            'javascript': 'javascript'
        };
        return frontendMap[backendLang] || 'javascript';
    };

    const getUserColor = useCallback((userId) => {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }, []);

    const updateRemoteCursor = useCallback((userId, position, selection) => {
        const editor = editorRef.current;
        if (!editor || userId === currentUserRef.current?.id) return;
        const monaco = monacoRef.current;
        if (!monaco || !monaco.Range) return;
        
        const user = collaborators.find(c => c.id === userId);
        // console.log("user",user);
        const userFirstName = user?.firstName || 'Anonymous';
        const cursorColor = getUserColor(userId);
        const newDecorations = [];
        
        if (selection && !selection.isEmpty) {
            newDecorations.push({
                range: new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn),
                options: {
                    className: `remote-selection user-${userId}`,
                    overviewRuler: { color: cursorColor + '80', position: monaco.editor.OverviewRulerLane.Center },
                    stickiness: monaco.editor.TrackedRangeStickiness.GrowsOnlyWhenTypingAfter,
                },
            });
        }
        
        newDecorations.push({
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            options: {
                className: `remote-cursor-line user-${userId}`,
                glyphMarginClassName: `remote-cursor-glyph user-${userId}`,
                glyphMarginHoverMessage: { value: `${userFirstName}'s cursor` },
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                overviewRuler: { color: cursorColor, position: monaco.editor.OverviewRulerLane.Center },
                zIndex: 999,
            },
        });
        
        const oldDecorations = decorationsMapRef.current.get(userId) || [];
        const newDecorationIds = editor.deltaDecorations(oldDecorations, newDecorations);
        decorationsMapRef.current.set(userId, newDecorationIds);
    }, [collaborators, getUserColor]);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        const startX = e.clientX;
        const initialWidth = leftPanelWidth;
        
        const doMouseMove = (event) => {
            const deltaX = event.clientX - startX;
            const newWidth = ((initialWidth * window.innerWidth / 100) + deltaX) / window.innerWidth * 100;
            const clampedWidth = Math.min(80, Math.max(20, newWidth));
            setLeftPanelWidth(clampedWidth);
            if (editorRef.current) {
                editorRef.current.layout();
            }
        };
        
        const doMouseUp = () => {
            document.removeEventListener('mousemove', doMouseMove);
            document.removeEventListener('mouseup', doMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
        
        document.addEventListener('mousemove', doMouseMove);
        document.addEventListener('mouseup', doMouseUp);
    }, [leftPanelWidth]);
    
    // --- Main Effect for Socket Connection and Data Fetching ---
    useEffect(() => {
        let isMounted = true;
        
        const fetchAndConnect = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch initial session data from the API
                const response = await axiosClient.get(`/code/${sessionId}`);
                const data = response.data;
                // console.log("data",data);
                if (!isMounted) return;
                
                // Set initial state from fetched data
                setProblemDetails(data.problemDetails);
                setCreatorId(data.creatorId);
                setCreatorName(data.creatorName);
                
                // Store startCode in problemDetails for easy access
                const problemDetailsWithStartCode = {
                    ...data.problemDetails,
                    startCode: data.startCode
                };
                setProblemDetails(problemDetailsWithStartCode);
                
                // Set language from backend or default to javascript - FIXED: Convert backend language to frontend format
                const backendLanguage = data.language || 'javascript';
                const frontendLanguage = getFrontendLanguage(backendLanguage);
                // console.log('Backend language:', backendLanguage, 'Frontend language:', frontendLanguage);
                // setLanguage(frontendLanguage);
                
                // Set the initial code content based on the language from backend
                const initialCodeForLanguage = data.startCode?.find(sc => sc.language === backendLanguage)?.initialCode || '';
                // console.log('Initial code for language', backendLanguage, ':', initialCodeForLanguage);
                setCode(initialCodeForLanguage);
                codeRef.current = initialCodeForLanguage;
                
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

                // Initialize Socket.IO connection
                const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                // console.log('Connecting to socket with user:', currentUser);
                
                const newSocket = io(`${SOCKET_SERVER_URL}/code`, {
                    withCredentials: true,
                    query: { 
                        sessionId,
                        userId: currentUser.id,
                        firstName: currentUser.firstName,
                        imageUrl: currentUser.imageUrl || ''
                    },
                    auth: { 
                        sessionId,
                        userId: currentUser.id,
                        firstName: currentUser.firstName,
                        imageUrl: currentUser.imageUrl || ''
                    },
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    forceNew: true
                });

                socketRef.current = newSocket;

                newSocket.on('connect', () => {
                    // console.log('Connected to socket server with user:', currentUser);
                    if (!isMounted) return;
                    
                    // Always re-emit user joined on connect/reconnect
                    newSocket.emit('user-joined', {
                        userId: currentUser.id,
                        firstName: currentUser.firstName,
                        imageUrl: currentUser.imageUrl || null
                    });
                    
                    hasJoinedRef.current = true;
                });
                
                newSocket.on('reconnect', () => {
                    // console.log('Reconnected to socket server, re-sending user data');
                    if (!isMounted) return;
                    
                    // Re-emit user data on reconnection
                    newSocket.emit('user-joined', {
                        userId: currentUser.id,
                        firstName: currentUser.firstName,
                        imageUrl: currentUser.imageUrl || null
                    });
                });
                
                newSocket.on('disconnect', (reason) => {
                    console.log('Disconnected from socket server:', reason);
                    if (!isMounted) return;
                    hasJoinedRef.current = false;
                    if (editorRef.current) {
                        decorationsMapRef.current.forEach(decorations => 
                            editorRef.current.deltaDecorations(decorations, [])
                        );
                        decorationsMapRef.current.clear();
                    }
                    setCollaborators([]);
                });

                newSocket.on('connect_error', (err) => {
                    if (!isMounted) return;
                    console.error(`[Socket ERROR] Connection error: ${err.message}`);
                    setError(`Connection failed: ${err.message}`);
                    setLoading(false);
                });
                
                newSocket.on('collaborators-update', (data) => {
                    if (!isMounted) return;
                    // console.log('Collaborators updated:', data.users);
                    // console.log('Current user for comparison:', currentUser);
                    
                    setCollaborators(prevCollaborators => {
                        const updatedCollaborators = data.users.map(serverUser => {
                            const existingUser = prevCollaborators.find(u => u.id === serverUser.id);
                            return { 
                                ...serverUser, 
                                isTyping: existingUser?.isTyping || false 
                            };
                        });
                        
                        // console.log('Updated collaborators:', updatedCollaborators);
                        
                        // Clean up decorations for users who left
                        const usersWhoLeft = prevCollaborators.filter(prevUser => 
                            !updatedCollaborators.some(currUser => currUser.id === prevUser.id)
                        );
                        
                        usersWhoLeft.forEach(leftUser => {
                            if (editorRef.current && decorationsMapRef.current.has(leftUser.id)) {
                                editorRef.current.deltaDecorations(decorationsMapRef.current.get(leftUser.id), []);
                                decorationsMapRef.current.delete(leftUser.id);
                            }
                        });
                        
                        return updatedCollaborators;
                    });
                });
                
                newSocket.on('user-typing', (data) => {
                    if (!isMounted || data.userId === currentUserRef.current?.id) return;
                    setCollaborators(prev => prev.map(user => 
                        user.id === data.userId ? { ...user, isTyping: data.isTyping } : user
                    ));
                });
                
                newSocket.on('code-change', (newCode) => {
                    if (!isMounted) return;
                    console.log('Received code change from socket:', newCode);
                    if (editorRef.current && newCode !== codeRef.current) {
                        ignoreChangeRef.current = true;
                        setCode(newCode);
                        codeRef.current = newCode;
                        editorRef.current.setValue(newCode);
                        ignoreChangeRef.current = false;
                    }
                });

                newSocket.on('cursor-change', (data) => {
                    if (!isMounted || data.userId === currentUserRef.current?.id) return;
                    updateRemoteCursor(data.userId, data.position, data.selection);
                });

                // FIXED: Language change socket handler with proper format conversion
                newSocket.on('language-change', (data) => {
                    if (!isMounted) return;
                    
                    console.log('Received language change from socket:', data);
                    
                    // Convert backend language format to frontend format
                    const frontendLanguage = getFrontendLanguage(data.language);
                    console.log('Converting backend language:', data.language, 'to frontend language:', frontendLanguage);
                    
                    setLanguage(frontendLanguage);
                    setCode(data.codeContent);
                    codeRef.current = data.codeContent;
                    
                    if (editorRef.current) {
                        ignoreChangeRef.current = true;
                        editorRef.current.setValue(data.codeContent);
                        ignoreChangeRef.current = false;
                    }
                });
                
            } catch (err) {
                if (!isMounted) return;
                console.error('[Setup ERROR] Error during initial data fetch or socket setup:', err);
                setError(err.response?.data?.message || err.message || 'Setup failed');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (sessionId) {
            fetchAndConnect();
        } else {
            setError("Session ID not found in URL.");
            setLoading(false);
        }

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            if (editorRef.current) {
                decorationsMapRef.current.forEach(decorations => 
                    editorRef.current.deltaDecorations(decorations, [])
                );
                decorationsMapRef.current.clear();
            }
        };
    }, [sessionId, currentUser]); // Fixed dependencies

    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        
        // Set initial code when editor mounts - with a small delay to ensure proper mounting
        setTimeout(() => {
            if (code && code !== editor.getValue()) {
                console.log('Setting code in editor on mount:', code);
                ignoreChangeRef.current = true;
                editor.setValue(code);
                ignoreChangeRef.current = false;
            }
        }, 100);
        
        const emitCursorInterval = setInterval(() => {
            if (socketRef.current?.connected && currentUserRef.current) {
                const position = editor.getPosition();
                const selection = editor.getSelection();
                if (position) {
                    socketRef.current.emit('cursor-change', {
                        userId: currentUserRef.current.id,
                        position: { lineNumber: position.lineNumber, column: position.column },
                        selection: selection?.isEmpty() ? null : {
                            startLineNumber: selection.startLineNumber, 
                            startColumn: selection.startColumn,
                            endLineNumber: selection.endLineNumber, 
                            endColumn: selection.endColumn,
                        },
                    });
                }
            }
        }, 500);
        
        const disposable = editor.onDidDispose(() => clearInterval(emitCursorInterval));
        
        return () => {
            clearInterval(emitCursorInterval);
            disposable.dispose();
        };
    }, [code]);
    
    const handleEditorChange = useCallback((value) => {
        if (ignoreChangeRef.current) return;
        
        const newValue = value || '';
        setCode(newValue);
        codeRef.current = newValue;
        
        if (socketRef.current?.connected && currentUserRef.current) {
            socketRef.current.emit('code-change', newValue);
            socketRef.current.emit('user-typing', { 
                userId: currentUserRef.current.id, 
                isTyping: true 
            });
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                if (socketRef.current?.connected && currentUserRef.current) {
                    socketRef.current.emit('user-typing', { 
                        userId: currentUserRef.current.id, 
                        isTyping: false 
                    });
                }
            }, 1000);
        }
    }, []);

    // Handle language change smoothly without remounting editor
    const handleLanguageChange = useCallback((e) => {
        if (!isHost) {
            alert("Only the session host can change the language.");
            return;
        }
        const newLang = e.target.value;
        // console.log('Language changing to:', newLang);
        
        if (socketRef.current?.connected && editorRef.current && monacoRef.current) {
            // Find the initial code for the new language - FIXED: Use backend language format for lookup
            const backendLang = getBackendLanguage(newLang);
            const newInitialCode = problemDetails?.startCode?.find(sc => sc.language === backendLang)?.initialCode || '';
            console.log('New initial code for', newLang, '(backend:', backendLang, '):', newInitialCode);
            
            // Update local state
            setLanguage(newLang);
            setCode(newInitialCode);
            codeRef.current = newInitialCode;
            
            // Update Monaco editor model language and content smoothly
            ignoreChangeRef.current = true;
            
            // Get the current model
            const model = editorRef.current.getModel();
            if (model) {
                // Set the language of the current model
                monacoRef.current.editor.setModelLanguage(model, getLanguageForMonaco(newLang));
                // Update the content
                model.setValue(newInitialCode);
            }
            
            ignoreChangeRef.current = false;
            
            // Emit to socket - FIXED: Send backend language format to socket
            socketRef.current.emit('language-change', {
                language: backendLang, // Send backend format
                codeContent: newInitialCode
            });
        }
    }, [isHost, problemDetails]);

    const handleThemeChange = useCallback((e) => {
        const newTheme = e.target.value;
        setSelectedTheme(newTheme);
        
        // Apply theme change immediately to existing editor
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(newTheme);
        }
    }, []);

    const handleRun = async () => {
        if (!problemDetails?._id) {
            alert('Problem details not loaded yet. Please wait.');
            return;
        }
        setIsRunning(true);
        setRunResult(null);
        setActiveLeftTab('testcase');
        
        try {
            const response = await axiosClient.post(`/submission/run/${problemDetails._id}`, {
                code: codeRef.current,
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
            } else if (response.data.error) {
                const errorTestCases = testCaseResults.map(testCase => ({
                    ...testCase, 
                    status: 'failed', 
                    actualOutput: 'Error occurred', 
                    error: response.data.error
                }));
                setTestCaseResults(errorTestCases);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
            setRunResult({
                success: false, 
                error: errorMessage, 
                testCases: []
            });
            const errorTestCases = testCaseResults.map(testCase => ({
                ...testCase, 
                status: 'failed', 
                actualOutput: 'Error occurred', 
                error: errorMessage
            }));
            setTestCaseResults(errorTestCases);
        } finally {
            setIsRunning(false);
        }
    };
    
    const handleSubmitCode = async () => {
        if (!isHost) {
            alert('Only the session host can submit solutions');
            return;
        }
        if (!problemDetails?._id) {
            alert('Problem details not loaded yet. Cannot submit.');
            return;
        }
        
        setIsSubmitting(true);
        setSubmitResult(null);
        setActiveLeftTab('result');
        
        try {
            const response = await axiosClient.post(`/submission/submit/${problemDetails._id}`, {
                code: codeRef.current,
                language: getBackendLanguage(language)
            });
            setSubmitResult(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
            setSubmitResult({
                accepted: false, 
                status: error.response?.data?.status || 'Failed', 
                error: errorMessage,
                passedTestCases: 0, 
                totalTestCases: 0, 
                runtime: null, 
                memory: null
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyShareLink = useCallback(() => {
        const link = `${window.location.origin}/code/${sessionId}`;
        navigator.clipboard.writeText(link).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(() => {
            alert('Failed to copy link. Please copy manually: ' + link);
        });
    }, [sessionId]);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'text-green-500';
            case 'medium': return 'text-yellow-500';
            case 'hard': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed': 
                return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>;
            case 'failed': 
                return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>;
            default: 
                return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>;
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
    
    const getTypingUsersDisplay = useCallback(() => {
        const typingUsersList = collaborators.filter(user => 
            user.isTyping && user.id !== currentUser.id
        );
        if (typingUsersList.length === 0) return null;
        
        const names = typingUsersList.map(user => user.firstName);
        const displayText = names.length === 1 
            ? `${names[0]} is typing...` 
            : `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` and ${names.length - 2} more` : ''} are typing...`;
        return displayText;
    }, [collaborators, currentUser.id]);

    // Show testcase tab content
    const renderTestCaseTab = () => {
        if (testCaseResults.length === 0) {
            return <div className="text-gray-400">No test cases available</div>;
        }

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Test Cases</h3>
                {testCaseResults.map((testCase, index) => (
                    <div key={testCase.id} className="bg-base-200/60 border border-base-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">Test Case {index + 1}</h4>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(testCase.status)}
                                {getStatusBadge(testCase.status)}
                            </div>
                        </div>
                        <div className="space-y-2 text-sm font-mono">
                            <div>
                                <strong className="text-gray-300">Input:</strong>
                                <pre className="bg-gray-800 p-2 rounded mt-1 text-gray-300">{testCase.input}</pre>
                            </div>
                            <div>
                                <strong className="text-gray-300">Expected Output:</strong>
                                <pre className="bg-gray-800 p-2 rounded mt-1 text-gray-300">{testCase.expectedOutput}</pre>
                            </div>
                            {testCase.actualOutput && (
                                <div>
                                    <strong className="text-gray-300">Actual Output:</strong>
                                    <pre className={`p-2 rounded mt-1 ${testCase.status === 'passed' ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
                                        {testCase.actualOutput}
                                    </pre>
                                </div>
                            )}
                            {testCase.error && (
                                <div>
                                    <strong className="text-gray-300">Error:</strong>
                                    <pre className="bg-red-900/20 text-red-300 p-2 rounded mt-1">{testCase.error}</pre>
                                </div>
                            )}
                            {testCase.runtime && (
                                <div className="text-gray-400">
                                    Runtime: {testCase.runtime}ms | Memory: {testCase.memory || 'N/A'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Show result tab content
    const renderResultTab = () => {
        if (!submitResult) {
            return <div className="text-gray-400">No submission results yet</div>;
        }

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Submission Result</h3>
                <div className="bg-base-200/60 border border-base-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-white">Status</h4>
                        <span className={`badge px-3 py-1 ${submitResult.status==="accepted" ? 'badge-success' : 'badge-error'}`}>
                            {submitResult.status}
                        </span>
                    </div>
                    
                    {submitResult.error && (
                        <div className="mb-4">
                            <strong className="text-red-400">Error:</strong>
                            <pre className="bg-red-900/20 text-red-300 p-2 rounded mt-1">{submitResult.error}</pre>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Test Cases:</span>
                            <span className="ml-2 text-white">
                                {submitResult.passedTestCases || 0} / {submitResult.totalTestCases || 0}
                            </span>
                        </div>
                        {submitResult.runtime !== null && submitResult.runtime !== undefined && (
                            <div>
                                <span className="text-gray-400">Runtime:</span>
                                <span className="ml-2 text-white">
                                    {submitResult.runtime > 0 ? `${submitResult.runtime}ms` : 'N/A'}
                                </span>
                            </div>
                        )}
                        {submitResult.memory !== null && submitResult.memory !== undefined && (
                            <div>
                                <span className="text-gray-400">Memory:</span>
                                <span className="ml-2 text-white">
                                    {submitResult.memory && submitResult.memory !== '0' ? submitResult.memory : 'N/A'}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-400">Status:</span>
                            <span className="ml-2 text-white">{submitResult.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-white">
                <Loader2 className="animate-spin mr-2" size={32} />
                <p>Loading session...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-red-400 p-4">
                <X size={48} className="mb-4" />
                <h1 className="text-2xl font-bold mb-2">Error Loading Session</h1>
                <p className="text-lg text-center">{error}</p>
                <button onClick={() => navigate('/')} className="btn btn-primary mt-6">Go to Home</button>
            </div>
        );
    }
    
    return (
        <div className="h-screen flex bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-base-content overflow-hidden">
            {/* Left Panel */}
            <div className="flex flex-col border-r border-base-300 bg-white/5 backdrop-blur-md shadow-inner" style={{ width: `${leftPanelWidth}%` }}>
                <div className="tabs tabs-lifted px-6 py-3 border-b border-base-300 flex justify-between items-center">
                    <div className="flex">
                        {['description', 'submissions', 'chatAI', 'testcase', 'result'].map((tab) => (
                            <button 
                                key={tab} 
                                className={`tab transition duration-200 ease-in-out text-md tracking-wide font-medium px-4 ${
                                    activeLeftTab === tab 
                                        ? 'tab-active text-primary border-b-2 border-primary' 
                                        : 'hover:text-primary/80'
                                }`}
                                onClick={() => setActiveLeftTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Session ID: {sessionId?.substring(0, 8)}</span>
                        <button 
                            onClick={copyShareLink} 
                            className="btn btn-xs btn-ghost tooltip" 
                            data-tip={isCopied ? "Copied!" : "Copy session link"}
                        >
                            {isCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-gray-200">
                    {/* Description Tab */}
                    {problemDetails && activeLeftTab === 'description' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-3xl font-extrabold text-primary-content drop-shadow-sm">
                                    {problemDetails.title}
                                </h1>
                                <div className={`badge badge-outline px-3 py-1 text-sm ${getDifficultyColor(problemDetails.difficulty)}`}>
                                    {problemDetails.difficulty}
                                </div>
                                <div className="badge badge-secondary px-3 py-1 text-sm">
                                    {problemDetails.tags}
                                </div>
                            </div>
                            <div className="prose prose-sm max-w-none prose-p:text-base-content/80 whitespace-pre-wrap leading-relaxed text-gray-300">
                                {problemDetails.description}
                            </div>
                            {problemDetails.visibleTestCases && problemDetails.visibleTestCases.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-white">Examples:</h3>
                                    <div className="grid gap-4">
                                        {problemDetails.visibleTestCases.map((example, index) => (
                                            <div key={index} className="rounded-xl bg-base-200/60 p-5 border border-base-300 shadow-sm">
                                                <h4 className="font-semibold text-white mb-2">Example {index + 1}:</h4>
                                                <div className="space-y-1 font-mono text-xs">
                                                    <div>
                                                        <strong>Input:</strong> 
                                                        <pre className="inline bg-gray-800 p-1 rounded text-xs text-gray-300 ml-2">
                                                            {example.input}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <strong>Output:</strong> 
                                                        <pre className="inline bg-gray-800 p-1 rounded text-xs text-gray-300 ml-2">
                                                            {example.output}
                                                        </pre>
                                                    </div>
                                                    {example.explanation && (
                                                        <div>
                                                            <strong>Explanation:</strong> 
                                                            <pre className="inline bg-gray-800 p-1 rounded text-xs text-gray-300 ml-2">
                                                                {example.explanation}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submissions Tab */}
                    {problemDetails && activeLeftTab === 'submissions' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-white">My Submissions</h2>
                            <Submissionhistory problemId={problemDetails._id} />
                        </div>
                    )}

                    {/* Chat AI Tab */}
                    {problemDetails && activeLeftTab === 'chatAI' && (
                        <div className="prose max-w-none">
                            <h2 className="text-xl font-bold mb-4 text-white">CHAT with AI</h2>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                                <ChatAi problem={problemDetails} />
                            </div>
                        </div>
                    )}

                    {/* Test Case Tab */}
                    {activeLeftTab === 'testcase' && renderTestCaseTab()}

                    {/* Result Tab */}
                    {activeLeftTab === 'result' && renderResultTab()}
                </div>
            </div>

            {/* Resizer */}
            <div 
                className="w-2 bg-gray-700 cursor-ew-resize hover:bg-blue-500 transition-colors duration-100 flex items-center justify-center" 
                onMouseDown={handleMouseDown}
            >
                <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
            </div>

            {/* Right Panel - Code Editor */}
            <div className="flex flex-col bg-base-100" style={{ width: `${100 - leftPanelWidth}%` }}>
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 bg-base-100 border-b border-base-300">
                        <div className="flex gap-4 items-center w-full justify-between">
                            {/* Language Selector */}
                            <div className="relative">
                                <select 
                                    className="select select-sm bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                                    value={language} 
                                    onChange={handleLanguageChange} 
                                    disabled={!isHost} 
                                    title={!isHost ? "Only the host can change the language" : ""}
                                >
                                    {supportedLanguages.map(lang => (
                                        <option key={lang.id} value={lang.id}>{lang.name}</option>
                                    ))}
                                </select>
                                {!isHost && (
                                    <div className="text-xs text-gray-500 mt-1">Host controls language</div>
                                )}
                            </div>

                            {/* Collaborators Info */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-gray-400" />
                                    <span className="text-sm text-gray-400">{collaborators.length} Online</span>
                                    {collaborators.length > 0 && (
                                        <div className="dropdown dropdown-end">
                                            <label tabIndex={0} className="btn btn-xs btn-ghost text-blue-400 hover:text-blue-300">
                                                View All
                                            </label>
                                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52 text-gray-200">
                                                <li className="menu-title"><span>Active Collaborators</span></li>
                                                {collaborators.map((collaborator) => (
                                                    <li key={collaborator.id}>
                                                        <div className="flex items-center gap-2 py-1">
                                                            <div className="avatar placeholder">
                                                                <div className="bg-neutral-focus text-neutral-content rounded-full w-6 h-6 flex items-center justify-center">
                                                                    {collaborator.imageUrl ? (
                                                                        <img 
                                                                            src={collaborator.imageUrl} 
                                                                            alt={collaborator.firstName} 
                                                                            className="rounded-full" 
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xs">
                                                                            {collaborator.firstName?.charAt(0)?.toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-sm">{collaborator.firstName}</span>
                                                            {collaborator.isTyping && (
                                                                <span className="loading loading-dots loading-xs text-primary"></span>
                                                            )}
                                                            {collaborator.id === currentUser.id && (
                                                                <span className="badge badge-primary badge-xs">You</span>
                                                            )}
                                                            {collaborator.id === creatorId && (
                                                                <span className="badge badge-secondary badge-xs">Host</span>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Typing Indicator */}
                                {getTypingUsersDisplay() && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
                                        <MessageCircle size={12} />
                                        <span>{getTypingUsersDisplay()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Theme Selector */}
                            <div className="relative">
                                <select 
                                    className="select select-sm bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                                    value={selectedTheme} 
                                    onChange={handleThemeChange}
                                >
                                    {themes.map((theme) => (
                                        <option key={theme} value={theme}>
                                            {theme.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Code Editor */}
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
                                tabSize: language === 'cpp' ? 4 : 2, // Different tab size for C++
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
                                bracketPairColorization: { enabled: true },
                                formatOnPaste: true,
                                formatOnType: true
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-base-100 border-t border-base-300 flex justify-between items-center p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Code size={16} />
                            <span>Current: {supportedLanguages.find(l => l.id === language)?.name}</span>
                            {!isHost && <span className="text-yellow-500">(Read-only for guests)</span>}
                        </div>
                        <div className="flex gap-4">
                            <button 
                                className={`btn btn-outline btn-sm ${
                                    isRunning ? 'opacity-70 cursor-not-allowed' : ''
                                } border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200`}
                                onClick={handleRun} 
                                disabled={isRunning}
                            >
                                {isRunning ? (
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                ) : (
                                    <Code size={16} className="mr-1" />
                                )}
                                Run
                            </button>
                            <button 
                                className={`btn btn-primary btn-sm ${
                                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                } bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 shadow-lg transition-all duration-200`}
                                onClick={handleSubmitCode} 
                                disabled={isSubmitting || !isHost} 
                                title={!isHost ? "Only the session host can submit" : ""}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                ) : null}
                                {isHost ? "Submit" : "Submit (Host Only)"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS for remote cursors */}
            <style jsx>{`
                .remote-cursor-line {
                    border-left: 2px solid currentColor;
                    background: transparent;
                }
                .remote-selection {
                    background-color: rgba(255, 255, 255, 0.1);
                    border: 1px solid currentColor;
                }
                .remote-cursor-glyph {
                    background: currentColor;
                    width: 2px !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    );
}

export default CollaborativeEditor;