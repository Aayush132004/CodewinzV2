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
    { id: 'python', name: 'Python' }
];

function CollaborativeEditor() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user: reduxUser } = useSelector((state) => state.auth);

    // User management - Memoized to prevent recreating user object on every render
    const currentUser = React.useMemo(() => {
        if (reduxUser && reduxUser._id) {
            return {
                id: reduxUser._id,
                firstName: reduxUser.firstName || 'User',
                imageUrl: reduxUser.profile?.url || null,
                isHost: false, // This will be updated by server data
            };
        }
        
        let anonId = localStorage.getItem('anonUserId');
        if (!anonId) {
            anonId = `anon_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('anonUserId', anonId);
        }
        return {
            id: anonId,
            firstName: `Anonymous`,
            imageUrl: null,
            isHost: false, // This will be updated by server data
        };
    }, [reduxUser]);

    // State
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
    const [connectionState, setConnectionState] = useState('connecting');

    // Refs
    const decorationsMapRef = useRef(new Map()); // Maps userId to decoration IDs
    const codeRef = useRef(''); // To keep track of the latest code value
    const ignoreChangeRef = useRef(false); // To prevent infinite loops on code changes
    const socketRef = useRef(null); // To hold the socket instance
    const editorRef = useRef(null); // To hold the Monaco editor instance
    const typingTimeoutRef = useRef(null); // For typing indicator debounce
    const lastCursorPositionRef = useRef(null); // To store last known cursor position for sync
    const hasJoinedRef = useRef(false); // Track if user has already joined
    const cursorSyncIntervalRef = useRef(null); // Track cursor sync interval

    // User color mapping - Memoized to prevent recalculation
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

    // Dynamic CSS for remote cursors and selections
    useEffect(() => {
        const styleId = 'monaco-remote-cursor-dynamic-styles';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        let baseCss = `
            .remote-cursor-line {
                background: transparent !important;
                border-left: 2px solid var(--remote-cursor-color, #007ACC) !important;
                position: relative;
            }
            .remote-cursor-line::before {
                content: attr(data-user-name);
                position: absolute;
                top: -20px;
                left: -2px;
                background: var(--remote-cursor-color, #007ACC);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 500;
                white-space: nowrap;
                z-index: 1000;
                pointer-events: none;
                transform: translateX(-50%);
            }
            .remote-selection {
                background: var(--remote-cursor-color, #007ACC) !important;
                opacity: 0.3 !important;
            }
            .remote-cursor-glyph {
                background: var(--remote-cursor-color, #007ACC) !important;
                width: 2px !important;
            }
        `;

        let dynamicCss = '';
        collaborators.forEach(user => {
            // Only generate styles for other users, not the current user
            if (user.id !== currentUser.id) {
                const cursorColor = getUserColor(user.id);
                const userFirstName = user.firstName || 'Anonymous';
                
                dynamicCss += `
                    .remote-cursor-line.user-${user.id} {
                        border-left-color: ${cursorColor} !important;
                        --remote-cursor-color: ${cursorColor};
                    }
                    .remote-cursor-line.user-${user.id}::before {
                        background: ${cursorColor};
                        content: "${userFirstName}";
                    }
                    .remote-selection.user-${user.id} {
                        background: ${cursorColor}80 !important;
                    }
                    .remote-cursor-glyph.user-${user.id} {
                        background: ${cursorColor} !important;
                    }
                `;
            }
        });
        
        styleElement.innerHTML = baseCss + dynamicCss;

        return () => {
            // Cleanup the dynamic style tag when component unmounts
            if (styleElement && styleElement.parentNode) {
                styleElement.parentNode.removeChild(styleElement);
            }
        };
    }, [collaborators, currentUser.id, getUserColor]);

    // Update remote cursors
    const updateRemoteCursor = useCallback((userId, position, selection) => {
        if (!editorRef.current || userId === currentUser.id) return; // Don't draw own cursor

        const monaco = window.monaco;
        if (!monaco) return;
        
        const model = editorRef.current.getModel();
        if (!model) return;

        const user = collaborators.find(c => c.id === userId);
        const userFirstName = user?.firstName || 'Anonymous';
        const cursorColor = getUserColor(userId);

        let newDecorations = [];

        // Selection decoration
        if (selection && !selection.isEmpty) {
            newDecorations.push({
                range: new monaco.Range(
                    selection.startLineNumber, 
                    selection.startColumn, 
                    selection.endLineNumber, 
                    selection.endColumn
                ),
                options: {
                    className: `remote-selection user-${userId}`,
                    overviewRuler: { 
                        color: cursorColor + '80', 
                        position: monaco.editor.OverviewRulerLane.Center 
                    },
                    stickiness: monaco.editor.TrackedRangeStickiness.GrowsOnlyWhenTypingAfter,
                },
            });
        }

        // Cursor decoration
        newDecorations.push({
            range: new monaco.Range(
                position.lineNumber, 
                position.column, 
                position.lineNumber, 
                position.column
            ),
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
        const newDecorationIds = editorRef.current.deltaDecorations(oldDecorations, newDecorations);
        decorationsMapRef.current.set(userId, newDecorationIds);
    }, [currentUser.id, collaborators, getUserColor]);

    // Resizable panel handler
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
                editorRef.current.layout(); // Force editor to re-layout
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

    // Socket connection and data fetching
    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;
        const maxRetries = 3;

        const fetchAndConnect = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch session data
                const response = await axiosClient.get(`/code/${sessionId}`);
                const data = response.data;

                if (!isMounted) return;

                setCode(data.codeContent);
                codeRef.current = data.codeContent;
                setLanguage(data.language);
                setCreatorName(data.creatorName);
                setProblemDetails(data.problemDetails);
                setIsHost(data.creatorId === currentUser.id);

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

                setLoading(false);

                // Initialize Socket.IO connection
                // Prevent re-connecting if already connected to the same session
                if (socketRef.current && socketRef.current.connected && 
                    socketRef.current.io.opts.query.sessionId === sessionId && 
                    hasJoinedRef.current) {
                    console.log(`[Socket] Already connected to session ${sessionId}. Skipping re-connection.`);
                    return;
                }

                // Disconnect existing socket if it's for a different session or stale
                if (socketRef.current) {
                    console.log("[Socket] Disconnecting old socket.");
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    setSocket(null);
                    hasJoinedRef.current = false;
                }

                const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const newSocket = io(`${SOCKET_SERVER_URL}/code`, {
                    withCredentials: true,
                    query: { sessionId },
                    auth: { sessionId },
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    forceNew: true // Force new connection to prevent stale connections
                });

                socketRef.current = newSocket;
                setSocket(newSocket);
                setConnectionState('connecting');
                console.log(`[Socket] Attempting to connect to ${SOCKET_SERVER_URL}/code for session ${sessionId}`);

                // Socket event handlers
                newSocket.on('connect', () => {
                    if (!isMounted || hasJoinedRef.current) return;
                    setConnectionState('connected');
                    console.log(`[Socket] Connected. Emitting 'user-join' for ${currentUser.firstName} (${currentUser.id}).`);
                    newSocket.emit('user-join', currentUser);
                    hasJoinedRef.current = true;
                });

                newSocket.on('disconnect', (reason) => {
                    if (!isMounted) return;
                    setConnectionState('disconnected');
                    hasJoinedRef.current = false;
                    console.log(`[Socket] Disconnected: ${reason}. Clearing remote cursors.`);
                    // Clear all remote cursors when disconnected
                    if (editorRef.current) {
                        decorationsMapRef.current.forEach(decorations => {
                            editorRef.current.deltaDecorations(decorations, []);
                        });
                        decorationsMapRef.current.clear();
                    }
                    setCollaborators([]); // Clear collaborators list
                });

                newSocket.on('connect_error', (err) => {
                    if (!isMounted) return;
                    setConnectionState('error');
                    hasJoinedRef.current = false;
                    console.error(`[Socket ERROR] Connection error: ${err.message}`);
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`[Socket] Retrying connection (${retryCount}/${maxRetries})...`);
                        setTimeout(() => newSocket.connect(), 2000 * retryCount);
                    } else {
                        setError(`Connection failed after multiple retries: ${err.message}`);
                    }
                });

                newSocket.on('collaborators-update', (data) => {
                    if (!isMounted) return;
                    console.log(`[Socket RECEIVE] 'collaborators-update':`, data.users);
                    
                    setCollaborators(prevCollaborators => {
                        const updatedCollaborators = data.users.map(serverUser => {
                            const existingUser = prevCollaborators.find(u => u.id === serverUser.id);
                            return {
                                ...serverUser,
                                isHost: data.creatorId === serverUser.id,
                                // Preserve client-side typing state if user already exists
                                isTyping: existingUser ? existingUser.isTyping : false 
                            };
                        });

                        // Remove decorations for users who are no longer in the updated list
                        const usersWhoLeft = prevCollaborators.filter(prevUser => 
                            !updatedCollaborators.some(currUser => currUser.id === prevUser.id)
                        );
                        usersWhoLeft.forEach(leftUser => {
                            if (editorRef.current && decorationsMapRef.current.has(leftUser.id)) {
                                console.log(`[Monaco] Clearing decorations for user ${leftUser.firstName} (${leftUser.id}) who left.`);
                                editorRef.current.deltaDecorations(decorationsMapRef.current.get(leftUser.id), []);
                                decorationsMapRef.current.delete(leftUser.id);
                            }
                        });

                        return updatedCollaborators;
                    });
                });

                newSocket.on('user-typing', (data) => {
                    if (!isMounted || data.userId === currentUser.id) return;
                    console.log(`[Socket RECEIVE] 'user-typing': ${data.userName} isTyping: ${data.isTyping}`);
                    setCollaborators(prev => {
                        const userIndex = prev.findIndex(user => user.id === data.userId);
                        if (userIndex !== -1) {
                            const newCollaborators = [...prev];
                            newCollaborators[userIndex] = { 
                                ...newCollaborators[userIndex], 
                                isTyping: data.isTyping 
                            };
                            return newCollaborators;
                        }
                        return prev; // User not found, might be a race condition, ignore
                    });
                });

                newSocket.on('user-left', (userId) => {
                    if (!isMounted) return;
                    console.log(`[Socket RECEIVE] 'user-left': ${userId}`);
                    // The 'collaborators-update' event should handle the actual removal from state.
                    // This event is primarily for immediate feedback or specific cleanup.
                    if (editorRef.current && decorationsMapRef.current.has(userId)) {
                        console.log(`[Monaco] Clearing decorations for user ${userId} (user-left event).`);
                        editorRef.current.deltaDecorations(decorationsMapRef.current.get(userId), []);
                        decorationsMapRef.current.delete(userId);
                    }
                    // No need to filter collaborators here, 'collaborators-update' is the source of truth.
                });

                newSocket.on('code-change', (newCode) => {
                    if (!isMounted) return;
                    console.log(`[Socket RECEIVE] 'code-change'. New code length: ${newCode.length}`);
                    if (editorRef.current && newCode !== codeRef.current) {
                        ignoreChangeRef.current = true; // Prevent re-emitting this change
                        editorRef.current.setValue(newCode);
                        setCode(newCode);
                        codeRef.current = newCode;
                        ignoreChangeRef.current = false;
                    }
                });

                newSocket.on('cursor-change', (data) => {
                    if (!isMounted || data.userId === currentUser.id) return;
                    console.log(`[Socket RECEIVE] 'cursor-change' from ${data.userName}:`, data.position);
                    updateRemoteCursor(data.userId, data.position, data.selection);
                });

                newSocket.on('language-change', (newLang) => {
                    if (!isMounted) return;
                    console.log(`[Socket RECEIVE] 'language-change': ${newLang}`);
                    setLanguage(newLang);
                });

                newSocket.on('code-error', (errMsg) => {
                    if (!isMounted) return;
                    console.error(`[Socket RECEIVE] 'code-error': ${errMsg}`);
                    setError(`Error from server: ${errMsg}`);
                });

            } catch (err) {
                if (!isMounted) return;
                console.error('[Setup ERROR] Error during initial data fetch or socket setup:', err);
                setError(err.response?.data?.message || err.message || 'Setup failed');
                setLoading(false);
            }
        };

        fetchAndConnect();

        return () => {
            isMounted = false;
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            if (cursorSyncIntervalRef.current) {
                clearInterval(cursorSyncIntervalRef.current);
            }
            
            if (socketRef.current && hasJoinedRef.current) {
                console.log(`[Socket] Cleaning up socket for session ${sessionId}. Emitting 'user-leave'.`);
                socketRef.current.emit('user-leave', { 
                    userId: currentUser.id, 
                    sessionId: sessionId 
                });
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                hasJoinedRef.current = false;
            }

            // Clear all decorations on component unmount
            if (editorRef.current) {
                decorationsMapRef.current.forEach(decorations => {
                    editorRef.current.deltaDecorations(decorations, []);
                });
                decorationsMapRef.current.clear();
            }
        };
    }, [sessionId, currentUser.id]); // Remove currentUser object, use only currentUser.id

    // Editor mount handler
    const handleEditorDidMount = useCallback((editor, monaco) => {
        setEditorInstance(editor);
        editorRef.current = editor;

        // Clear any existing cursor sync interval
        if (cursorSyncIntervalRef.current) {
            clearInterval(cursorSyncIntervalRef.current);
        }

        // Set initial value if already fetched
        if (codeRef.current) {
            editor.setValue(codeRef.current);
        }

        // Track cursor position for local user
        lastCursorPositionRef.current = editor.getPosition();

        editor.onDidChangeModelContent(() => {
            if (ignoreChangeRef.current) return; // Ignore changes coming from socket

            const updatedCode = editor.getValue();
            if (socketRef.current?.connected && updatedCode !== codeRef.current) {
                codeRef.current = updatedCode;
                setCode(updatedCode);
                socketRef.current.emit('code-change', updatedCode);
                console.log(`[Socket EMIT] 'code-change'. New code length: ${updatedCode.length}`);

                // Typing indicator
                socketRef.current.emit('user-typing', { 
                    userId: currentUser.id, 
                    isTyping: true, 
                    userName: currentUser.firstName 
                });
                
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                
                typingTimeoutRef.current = setTimeout(() => {
                    if (socketRef.current?.connected) {
                        socketRef.current.emit('user-typing', { 
                            userId: currentUser.id, 
                            isTyping: false, 
                            userName: currentUser.firstName 
                        });
                    }
                }, 1000); // Debounce typing indicator
            }
        });

        // Enhanced cursor tracking
        editor.onDidChangeCursorPosition((e) => {
            const position = editor.getPosition();
            const selection = editor.getSelection();
            lastCursorPositionRef.current = position; // Update last known position

            if (socketRef.current?.connected) {
                socketRef.current.emit('cursor-change', {
                    userId: currentUser.id,
                    userName: currentUser.firstName,
                    position: { 
                        lineNumber: position.lineNumber, 
                        column: position.column 
                    },
                    selection: selection?.isEmpty() ? null : { // Only send selection if not empty
                        startLineNumber: selection.startLineNumber,
                        startColumn: selection.startColumn,
                        endLineNumber: selection.endLineNumber,
                        endColumn: selection.endColumn,
                        isEmpty: selection.isEmpty()
                    },
                    timestamp: Date.now()
                });
                console.log(`[Socket EMIT] 'cursor-change' for self:`, position);
            }
        });

        // Periodically send cursor position to keep it synced (e.g., if user is idle but cursor moved by external action)
        cursorSyncIntervalRef.current = setInterval(() => {
            if (socketRef.current?.connected && lastCursorPositionRef.current) {
                const position = lastCursorPositionRef.current;
                const selection = editor.getSelection(); // Get current selection
                socketRef.current.emit('cursor-change', {
                    userId: currentUser.id,
                    userName: currentUser.firstName,
                    position: { 
                        lineNumber: position.lineNumber, 
                        column: position.column 
                    },
                    selection: selection?.isEmpty() ? null : {
                        startLineNumber: selection.startLineNumber,
                        startColumn: selection.startColumn,
                        endLineNumber: selection.endLineNumber,
                        endColumn: selection.endColumn,
                        isEmpty: selection.isEmpty()
                    },
                    timestamp: Date.now()
                });
            }
        }, 2000); // Every 2 seconds

    }, [currentUser.id, currentUser.firstName]); // Use specific properties instead of whole object

    const handleEditorChange = useCallback((value) => {
        setCode(value || '');
    }, []);
    
    const handleLanguageChange = useCallback((newLang) => {
        console.log(`%c[UI Event] Language changed to: ${newLang}`, 'color: blue;');
        setLanguage(newLang);
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('language-change', newLang);
            console.log(`%c[Socket EMIT] 'language-change' for ${newLang}.`, 'color: orange;');
        }
    }, []);
    
    const handleThemeChange = useCallback((theme) => {
        console.log(`%c[UI Event] Theme changed to: ${theme}`, 'color: blue;');
        setSelectedTheme(theme);
    }, []);
    
    const handleRun = async () => {
        if (!problemDetails?._id) {
            alert('Problem details not loaded yet. Please wait.');
            return;
        }
        console.log(`%c[Execution] Running code for problem ${problemDetails?._id}. Language: ${language}`, 'color: yellow;');
        setLoading(true);
        setRunResult(null);
        setActiveLeftTab('testcase'); // Switch to test case tab to show results
    
        try {
            const response = await axiosClient.post(`/submission/run/${problemDetails._id}`, {
                code: codeRef.current,
                language: getBackendLanguage(language)
            });
    
            console.log("%c[Execution] Run result received:", 'color: green;', response.data);
            setRunResult(response.data);
    
            if (response.data.testCases && testCaseResults.length > 0) {
                const updatedTestCases = testCaseResults.map((testCase, index) => {
                    const result = response.data.testCases[index];
                    if (result) {
                        return {
                            ...testCase,
                            actualOutput: result.stdout || result.output || '',
                            status: result.status_id === 3 ? 'passed' : 'failed', // Judge0 status_id 3 is Accepted
                            runtime: result.time || response.data.runtime,
                            memory: result.memory || response.data.memory,
                            error: result.stderr || result.compile_output || null
                        };
                    }
                    return testCase; // Keep original if no result for this index
                });
                setTestCaseResults(updatedTestCases);
                console.log("[Execution] Updated test case results:", updatedTestCases);
            } else if (response.data.error) {
                // Handle general execution errors not tied to specific test cases
                const errorTestCases = testCaseResults.map(testCase => ({
                    ...testCase, status: 'failed', actualOutput: 'Error occurred', error: response.data.error
                }));
                setTestCaseResults(errorTestCases);
            }
        } catch (error) {
            console.error('%c[Execution ERROR] Error running code:', 'color: red;', error);
            const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
            setRunResult({
                success: false, error: errorMessage, testCases: []
            });
    
            const errorTestCases = testCaseResults.map(testCase => ({
                ...testCase, status: 'failed', actualOutput: 'Error occurred', error: errorMessage
            }));
            setTestCaseResults(errorTestCases);
        } finally {
            setLoading(false);
            console.log("[Execution] Run process finished.");
        }
    };
    
    const handleSubmitCode = async () => {
        if (!isHost) {
            alert('Only the session host can submit solutions');
            console.warn("[Submission] Non-host attempted to submit.");
            return;
        }
        if (!problemDetails?._id) {
            alert('Problem details not loaded yet. Cannot submit.');
            return;
        }
        console.log(`%c[Submission] Submitting code for problem ${problemDetails?._id}. Language: ${language}`, 'color: yellow;');
        setLoading(true);
        setSubmitResult(null);
        setActiveLeftTab('result'); // Switch to result tab to show submission outcome
    
        try {
            const response = await axiosClient.post(`/submission/submit/${problemDetails._id}`, {
                code: codeRef.current,
                language: getBackendLanguage(language)
            });
    
            console.log("%c[Submission] Submit result received:", 'color: green;', response.data);
            setSubmitResult(response.data);
        } catch (error) {
            console.error('%c[Submission ERROR] Error submitting code:', 'color: red;', error);
            const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
            setSubmitResult({
                accepted: false, status: error.response?.data?.status || 'Failed', error: errorMessage,
                passedTestCases: 0, totalTestCases: 0, runtime: null, memory: null // Ensure all fields are present
            });
        } finally {
            setLoading(false);
            console.log("[Submission] Submit process finished.");
        }
    };
    
    const copyShareLink = useCallback(() => {
        const link = `${window.location.origin}/code/${sessionId}`;
        navigator.clipboard.writeText(link).then(() => {
            setIsCopied(true);
            console.log("%c[UI Event] Copied session link:", 'color: blue;', link);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(() => {
            alert('Failed to copy link. Please copy manually: ' + link);
            console.error("%c[UI Event ERROR] Failed to copy link.", 'color: red;');
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
    
    const getBackendLanguage = (lang) => {
        if (lang === 'cpp') return 'c++';
        return lang;
    };
    
    const getLanguageForMonaco = (lang) => {
        // Monaco uses 'cpp' for C++, not 'c++'
        if (lang === 'cpp') return 'cpp'; 
        return lang;
    };
    
    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed': return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'failed': return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            default: return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        }
    };
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'passed': return <span className="badge badge-success text-white text-xs px-2 py-1">Passed</span>;
            case 'failed': return <span className="badge badge-error text-white text-xs px-2 py-1">Failed</span>;
            default: return <span className="badge badge-ghost text-xs px-2 py-1">Pending</span>;
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
                {/* Left Tabs */}
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
                            className="btn btn-xs btn-ghost tooltip" data-tip={isCopied ? "Copied!" : "Copy session link"}
                        >
                            {isCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                        </button>
                    </div>
                </div>

                {/* Left Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-gray-200">
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

                                    <div className="prose prose-sm max-w-none prose-p:text-base-content/80 whitespace-pre-wrap leading-relaxed text-gray-300">
                                        {problemDetails.description}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 text-white">Examples:</h3>
                                        <div className="grid gap-4">
                                            {problemDetails.visibleTestCases.map((example, index) => (
                                                <div key={index} className="rounded-xl bg-base-200/60 p-5 border border-base-300 shadow-sm">
                                                    <h4 className="font-semibold text-white mb-2">Example {index + 1}:</h4>
                                                    <div className="space-y-1 font-mono text-xs">
                                                        <div><strong>Input:</strong> <pre className="inline bg-gray-800 p-1 rounded text-xs text-gray-300">{example.input}</pre></div>
                                                        <div><strong>Output:</strong> <pre className="inline bg-gray-800 p-1 rounded text-xs text-gray-300">{example.output}</pre></div>
                                                        {example.explanation && (
                                                            <div><strong>Explanation:</strong> <pre className="inline bg-gray-800 p-1 rounded text-xs text-gray-300">{example.explanation}</pre></div>
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
                                    <h2 className="text-xl font-semibold mb-4 text-white">My Submissions</h2>
                                    <Submissionhistory problemId={problemDetails._id} />
                                </div>
                            )}

                            {activeLeftTab === 'chatAI' && (
                                <div className="prose max-w-none">
                                    <h2 className="text-xl font-bold mb-4 text-white">CHAT with AI</h2>
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
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
                                        <div className={`rounded-lg p-4 shadow-md ${submitResult?.status === "accepted" ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                                            <div className={`flex items-center gap-2 mb-3 ${submitResult?.status === "accepted" ? 'text-green-400' : 'text-red-400'}`}>
                                                {submitResult?.status === "accepted" ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                )}
                                                <span className="text-lg font-bold">{submitResult?.status === "accepted" ? 'Submission Accepted' : `${submitResult?.status ? submitResult?.status : "Submission Failed"}`}</span>
                                            </div>

                                            <p className="text-sm text-gray-300 mb-4">
                                                {submitResult?.status === "accepted"
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

                            {/* Online Users Display with Collaborators List (Improved) */}
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
                                                <li className="menu-title">
                                                    <span>Active Collaborators</span>
                                                </li>
                                                {collaborators.map((collaborator) => (
                                                    <li key={collaborator.id}>
                                                        <div className="flex items-center gap-2 py-1">
                                                            <div className="avatar placeholder">
                                                                <div className="bg-neutral-focus text-neutral-content rounded-full w-6 h-6 flex items-center justify-center">
                                                                    {collaborator.imageUrl ? (
                                                                        <img src={collaborator.imageUrl} alt={collaborator.firstName} className="rounded-full" />
                                                                    ) : (
                                                                        <span className="text-xs">{collaborator.firstName?.charAt(0)?.toUpperCase()}</span>
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
                                                            {collaborator.isHost && (
                                                                <span className="badge badge-secondary badge-xs">Host</span>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Typing Indicators (Display string from getTypingUsersDisplay) */}
                                {getTypingUsersDisplay() && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
                                        <MessageCircle size={12} />
                                        <span>{getTypingUsersDisplay()}</span>
                                    </div>
                                )}
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
                                className={`btn btn-outline btn-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''} border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200`}
                                onClick={handleRun}
                                disabled={loading}
                            >
                                {loading && (activeLeftTab === 'testcase' || activeLeftTab === 'result') ? <Loader2 className="animate-spin mr-2" size={16} /> : <Code size={16} className="mr-1" />}
                                Run
                            </button>
                            <button
                                className={`btn btn-primary btn-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''} bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 shadow-lg transition-all duration-200`}
                                onClick={handleSubmitCode}
                                disabled={loading || !isHost}
                                title={!isHost ? "Only the session host can submit" : ""}
                            >
                                {loading && (activeLeftTab === 'testcase' || activeLeftTab === 'result') ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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