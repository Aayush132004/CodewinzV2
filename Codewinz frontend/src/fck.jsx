import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router'; // Corrected: useNavigate from 'react-router-dom'
import { Users, Code, Copy, Check, X, Loader2, Share2, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosClient from "../../utils/axiosClient";
// Assuming these components are correctly implemented and available
import Submissionhistory from '../components/Submissionhistory';
import ChatAi from '../components/ChatAi';

// Define languages and their Monaco equivalents (added Python for commonality)
const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'python', name: 'Python' } // Added Python
];

function CollaborativeEditor() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user: reduxUser } = useSelector((state) => state.auth);

    // --- Helper function to get current user details ---
    // Memoized with useCallback to ensure a stable function reference
    // Persists anonymous user ID in localStorage for consistency across sessions/reloads
    const getCurrentUser = useCallback(() => {
        console.log("[User Init] Determining current user...");
        if (reduxUser && reduxUser._id) {
            console.log("[User Init] Authenticated User:", { id: reduxUser._id, firstName: reduxUser.firstName, imageUrl: reduxUser.profile?.url });
            return {
                id: reduxUser._id,
                firstName: reduxUser.firstName || 'User',
                imageUrl: reduxUser.profile?.url || null,
                isHost: false, // This will be set based on session data from backend
            };
        }
        // Fallback for unauthenticated users
        let anonId = localStorage.getItem('anonUserId');
        if (!anonId) {
            anonId = `anon_${Math.random().toString(36).substring(2, 9)}`; // Shorter random ID
            localStorage.setItem('anonUserId', anonId);
            console.log("[User Init] Generated new anonymous user ID:", anonId);
        } else {
            console.log("[User Init] Using existing anonymous user ID:", anonId);
        }
        return {
            id: anonId,
            firstName: `Anonymous`,
            imageUrl: null,
            isHost: false,
        };
    }, [reduxUser]); // Re-create if reduxUser object reference changes

    const currentUser = getCurrentUser(); // Call it once to get the current user object

    // --- State variables ---
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [editorInstance, setEditorInstance] = useState(null); // Monaco editor instance
    const [socket, setSocket] = useState(null); // Socket.IO client instance
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    // `collaborators` will hold [{id, firstName, imageUrl, isTyping, isHost}, ...]
    const [collaborators, setCollaborators] = useState([]);
    const [creatorName, setCreatorName] = useState(''); // Name of the session creator
    const [problemDetails, setProblemDetails] = useState(null);
    const [activeLeftTab, setActiveLeftTab] = useState('description');
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [testCaseResults, setTestCaseResults] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState('vs-dark');
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [isHost, setIsHost] = useState(false); // Flag if current user is the session host

    // --- Refs for managing real-time data and avoiding stale closures ---
    const decorationsMapRef = useRef(new Map()); // Map: userId -> Monaco decoration IDs for cursors/selections
    const codeRef = useRef(''); // Stores the latest code value, updated by local and remote changes
    const ignoreChangeRef = useRef(false); // Flag to prevent infinite loops on editor content change
    const socketRef = useRef(null); // Direct reference to the Socket.IO client instance
    const isResizing = useRef(false); // Flag for panel resizing
    const editorRef = useRef(null); // Direct reference to the Monaco editor instance
    const typingTimeoutRef = useRef(null); // Ref for typing debounce timeout

    // --- Helper function to get a consistent color for each user's cursor ---
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

    // --- CSS for remote cursors and user names (Injected once on mount) ---
    useEffect(() => {
         const styleId = 'monaco-remote-cursor-styles';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    // Clear existing rules
    while (styleElement.sheet.cssRules.length > 0) {
        styleElement.sheet.deleteRule(0);
    }

    // Add base styles
    styleElement.sheet.insertRule(`
        .remote-cursor-line {
            background: transparent !important;
            border-left: 2px solid var(--monaco-remote-cursor-color, #007ACC) !important;
            position: relative;
        }
    `);
        styleElement.textContent = `
            .remote-cursor-line {
                background: transparent !important;
                border-left: 2px solid var(--monaco-remote-cursor-color, #007ACC) !important;
                position: relative;
            }
            .remote-cursor-line::before {
                content: attr(data-user-name);
                position: absolute;
                top: -20px;
                left: -2px;
                background: var(--monaco-remote-cursor-color, #007ACC);
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
                background: var(--monaco-remote-cursor-color, #007ACC) !important;
                opacity: 0.3 !important;
            }
            .remote-cursor-glyph {
                background: var(--monaco-remote-cursor-color, #007ACC) !important;
                width: 2px !important;
            }
        `;

         return () => {
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
    };
}, []);

    // --- Monaco Editor Remote Cursor / Selection Handling Logic ---
    const updateRemoteCursor = useCallback((userId, position, selection) => {
        if (!editorRef.current || userId === currentUser.id) {
            return;
        }

        const monaco = window.monaco;
        if (!monaco) { console.warn("[Monaco Decor] Monaco instance (window.monaco) not available."); return; }
        const model = editorRef.current.getModel();
        if (!model) { console.warn("[Monaco Decor] Editor model not available."); return; }

        const user = collaborators.find(c => c.id === userId);
        const userFirstName = user?.firstName || 'Anonymous';
        const cursorColor = getUserColor(userId);

        let newDecorations = [];

        // 1. Selection decoration
        if (selection && !selection.isEmpty) {
            newDecorations.push({
                range: new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn),
                options: {
                    className: 'remote-selection',
                    overviewRuler: { color: cursorColor + '80', darkColor: cursorColor + '80', position: monaco.editor.OverviewRulerLane.Center },
                    stickiness: monaco.editor.TrackedRangeStickiness.GrowsOnlyWhenTypingAfter,
                    inlineClassName: `remote-selection-color-${userId}`
                },
            });
        }

        // 2. Cursor decoration
        newDecorations.push({
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            options: {
                className: 'remote-cursor-line',
                glyphMarginClassName: 'remote-cursor-glyph',
                glyphMarginHoverMessage: { value: `${userFirstName}'s cursor` },
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                overviewRuler: { color: cursorColor, darkColor: cursorColor, position: monaco.editor.OverviewRulerLane.Center },
                zIndex: 999,
                inlineClassName: `remote-cursor-color-${userId}`
            },
        });

        const oldDecorations = decorationsMapRef.current.get(userId) || [];
        const newDecorationIds = editorRef.current.deltaDecorations(oldDecorations, newDecorations);
        decorationsMapRef.current.set(userId, newDecorationIds);

        // Apply CSS variables to target the specific elements created by Monaco
        setTimeout(() => {
            const styleSheet = document.getElementById('monaco-remote-cursor-styles').sheet;
            if (!styleSheet) return;

            let rulesToRemove = [];
            for (let i = 0; i < styleSheet.cssRules.length; i++) {
                const rule = styleSheet.cssRules[i];
                if (rule.selectorText && (rule.selectorText.includes(`.remote-cursor-color-${userId}`) || rule.selectorText.includes(`.remote-selection-color-${userId}`))) {
                    rulesToRemove.push(i);
                }
            }
            for (let i = rulesToRemove.length - 1; i >= 0; i--) {
                styleSheet.deleteRule(rulesToRemove[i]);
            }

            const colorRule = `
                .remote-cursor-color-${userId} { border-left-color: ${cursorColor} !important; background: ${cursorColor} !important; }
                .remote-cursor-color-${userId}::before { background: ${cursorColor} !important; content: "${userFirstName}"; }
                .remote-selection-color-${userId} { background: ${cursorColor}80 !important; }
            `;
            styleSheet.insertRule(colorRule, styleSheet.cssRules.length);

            editorRef.current.getContainerDomNode().querySelectorAll(`.remote-cursor-color-${userId}`).forEach(el => {
                if (el.classList.contains('remote-cursor-line')) {
                    el.setAttribute('data-user-name', userFirstName);
                }
            });

        }, 0);
    }, [currentUser.id, collaborators, getUserColor]);
       
    // --- Resizable panel handlers ---
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
            console.log("[Resize] Panel resize finished.");
        };

        document.addEventListener('mousemove', doMouseMove);
        document.addEventListener('mouseup', doMouseUp);
        console.log("[Resize] Panel resize started.");
    }, [leftPanelWidth]);

    // --- Core Data Fetching and Socket.IO Setup ---
    useEffect(() => {
        let isMounted = true; // Flag to track if component is mounted

        const fetchAndConnect = async () => {
          try{
            console.log(`%c[Init] Fetching session data and connecting Socket.IO for session: ${sessionId}`, 'color: #8A2BE2;');
            console.log("[Init] Current User for connection:", currentUser);

            setLoading(true);
            setError(null);

            // 1. Fetch session data
            try {
                const response = await axiosClient.get(`/code/${sessionId}`);
                const data = response.data;
                console.log(`%c[API] Fetched session data:`, 'color: #8A2BE2;', data);

                if (!isMounted) return; // Prevent state updates if component unmounted

                setCode(data.codeContent);
                codeRef.current = data.codeContent;
                setLanguage(data.language);
                setCreatorName(data.creatorName);
                setProblemDetails(data.problemDetails);
                setIsHost(data.creatorId === currentUser.id);
                console.log(`%c[Init] Is current user (${currentUser.id}) host? ${data.creatorId === currentUser.id}`, 'color: #8A2BE2;');

                if (data.problemDetails?.visibleTestCases) {
                    setTestCaseResults(data.problemDetails.visibleTestCases.map((testCase, index) => ({
                        id: index, input: testCase.input, expectedOutput: testCase.output, explanation: testCase.explanation,
                        actualOutput: null, status: 'pending', runtime: null, memory: null
                    })));
                    console.log("[Problem] Initialized test cases.");
                }
                
                // Moved setLoading(false) here after initial data fetch if no socket issues
                // This ensures content is shown as soon as data is ready, even before socket connects fully.
                // It will be set back to true if socket connection fails.
                setLoading(false); 

            } catch (err) {
                if (!isMounted) return; // If component unmounted during fetch, stop.
                console.error('%c[API Error] Error fetching session data:', 'color: red;', err);
                setError(err.response?.data?.message || err.message || 'Could not load session data.');
                setLoading(false);
                return; // Exit if data fetch fails
            }

            try{

            // 2. Initialize Socket.IO connection
            // Crucial: Check if a socket already exists in the ref and is connected for this session.
            // This prevents re-connecting if the effect somehow re-runs without sessionId changing.
            if (socketRef.current && socketRef.current.connected && socketRef.current.io.opts.query.sessionId === sessionId) {
                console.log(`%c[Socket Init] Socket already connected for ${sessionId}. Skipping new connection.`, 'color: yellow;');
                return; // Exit if already connected
            }
            
            // Disconnect any existing socket from a *previous* render/cleanup cycle if it wasn't cleaned up properly.
            // This is a defensive step for cases where cleanup might not have completed before re-execution.
            if (socketRef.current && !socketRef.current.disconnected) { // Check if it's connected or connecting
                console.warn(`%c[Socket Init] Found existing socket not disconnected. Disconnecting it.`, 'color: orange;');
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null); // Clear state to ensure a fresh connection next
            }

            const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            console.log(`%c[Socket Init] Attempting new Socket.IO connection to: ${SOCKET_SERVER_URL}/code`, 'color: #1E90FF;');

            const newSocket = io(`${SOCKET_SERVER_URL}/code`, {
                withCredentials: true,
                query: { sessionId: sessionId },
                auth: { sessionId: sessionId }
            });

            socketRef.current = newSocket; // Update ref first
            setSocket(newSocket); // Update state

            // --- Socket.IO Event Listeners (Bound once per socket instance) ---
            newSocket.on('connect', () => {
                if (!isMounted) return;
                console.log(`%c[Socket EVENT] CONNECTED to server for session ${sessionId}. Socket ID: ${newSocket.id}`, 'color: lightgreen;');
                setError(null);
                newSocket.emit('user-join', currentUser);
                console.log(`%c[Socket EMIT] 'user-join' for user:`, 'color: orange;', currentUser);
            });

            newSocket.on('disconnect', (reason) => {
                if (!isMounted) return; // Important check for async disconnect
                console.log(`%c[Socket EVENT] DISCONNECTED from session ${sessionId}. Reason: ${reason}`, 'color: red;');
                if (editorRef.current) {
                    decorationsMapRef.current.forEach(decorations => {
                        editorRef.current.deltaDecorations(decorations, []);
                    });
                    decorationsMapRef.current.clear();
                    console.log(`%c[Monaco] Cleared all remote editor decorations on disconnect.`, 'color: red;');
                }
                setCollaborators([]);
                console.log(`%c[Collaborators] Cleared list on disconnect.`, 'color: red;');
            });

            newSocket.on('connect_error', (err) => {
                if (!isMounted) return;
                console.error('%c[Socket ERROR] Connection Error:', 'color: red;', err.message, err);
                setError(`Connection failed: ${err.message}. Please try refreshing.`);
                // setLoading(false); // Set loading to false on error
            });

            newSocket.on('collaborators-update', (data) => {
                if (!isMounted) return;
                console.log('%c[Socket EVENT] Received collaborators-update:', 'color: cyan;', data);
                if (Array.isArray(data.users)) {
                    const updatedCollaborators = data.users.map(user => ({
                        ...user,
                        isHost: data.creatorId === user.id
                    }));
                    setCollaborators(updatedCollaborators);
                    console.log(`%c[Collaborators] State updated. Total: ${updatedCollaborators.length} active users.`, 'color: cyan;');
                }
            });

            newSocket.on('user-typing', (data) => {
                if (!isMounted || data.userId === currentUser.id) return;
                setCollaborators(prev => {
                    const userIndex = prev.findIndex(user => user.id === data.userId);
                    if (userIndex !== -1) {
                        const newCollaborators = [...prev];
                        newCollaborators[userIndex] = { ...newCollaborators[userIndex], isTyping: data.isTyping };
                        return newCollaborators;
                    } else {
                        console.warn(`%c[Collaborators] Typing user ${data.userId} not found in current list, adding temporarily.`, 'color: orange;');
                        return [...prev, { id: data.userId, firstName: data.userName || `Anonymous`, imageUrl: null, isTyping: data.isTyping, isHost: false }];
                    }
                });
            });

            newSocket.on('user-left', (userId) => {
                if (!isMounted) return;
                console.log(`%c[Socket EVENT] User ${userId} left the session.`, 'color: red;');
                if (editorRef.current && decorationsMapRef.current.has(userId)) {
                    editorRef.current.deltaDecorations(decorationsMapRef.current.get(userId), []);
                    decorationsMapRef.current.delete(userId);
                    console.log(`%c[Monaco] Removed decorations for user ${userId}.`, 'color: red;');
                }
            });

            newSocket.on('code-change', (newCode) => {
                if (!isMounted) return;
                if (editorRef.current && newCode !== codeRef.current) {
                    ignoreChangeRef.current = true;
                    editorRef.current.setValue(newCode);
                    setCode(newCode);
                    codeRef.current = newCode;
                    ignoreChangeRef.current = false;
                }
            });

            newSocket.on('cursor-change', (data) => {
                if (!isMounted || data.userId === currentUser.id) return;
                updateRemoteCursor(data.userId, data.position, data.selection);
            });

            newSocket.on('language-change', (newLang) => {
                if (!isMounted) return;
                console.log(`%c[Socket EVENT] Received language-change: ${newLang}`, 'color: purple;');
                setLanguage(newLang);
            });

            newSocket.on('code-error', (errMsg) => {
                if (!isMounted) return;
                console.error('%c[Socket ERROR] Server reported code error:', 'color: red;', errMsg);
                setError(`Error from server: ${errMsg}`);
            });
            
            // Final setLoading(false) is now handled outside the try/catch of fetchAndConnect
            // because initial loading state is true, and it should only be false if data is loaded
            // and socket connection is attempted or successful.

        } catch (err) { // This outer catch handles errors in the overall fetchAndConnect process
            if (!isMounted) return;
            console.error('%c[Session ERROR] Error during setup process (outer catch):', 'color: red;', err);
            setError(err.response?.data?.message || err.message || 'An unexpected error occurred during session setup.');
            setLoading(false);
        }
    } catch (err) {
            if (!isMounted) return;
            console.error('%c[Session ERROR] Error during setup process:', 'color: red;', err);
            setError(err.response?.data?.message || err.message || 'An unexpected error occurred during session setup.');
            setLoading(false);
        }
        };

    fetchAndConnect();

    // --- Cleanup function for this useEffect ---
    return () => {
        isMounted = false; // Set flag to false on unmount/re-run
        console.log(`%c[Cleanup] Running cleanup for session ${sessionId} (useEffect cleanup).`, 'color: gray;');
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            console.log("[Cleanup] Cleared typing timeout.");
        }
        
        // Disconnect and clear socket if it exists and is not already disconnected
        if (socketRef.current && !socketRef.current.disconnected) {
            console.log(`%c[Cleanup] Emitting 'user-leave' for user ${currentUser.id} before disconnect.`, 'color: orange;');
            socketRef.current.emit('user-leave', { userId: currentUser.id, sessionId: sessionId });
            socketRef.current.disconnect();
            socketRef.current = null; // Clear the ref
            setSocket(null); // Clear state
            console.log(`%c[Cleanup] Socket disconnected and references cleared.`, 'color: gray;');
        } else if (socketRef.current) {
             console.log(`%c[Cleanup] Socket ref exists but already disconnected.`, 'color: gray;');
             socketRef.current = null; // Ensure ref is null
             setSocket(null); // Ensure state is null
        }

        // Clear all decorations and editor instance on cleanup
        if (editorRef.current) {
            decorationsMapRef.current.forEach(decorations => {
                editorRef.current.deltaDecorations(decorations, []);
            });
            decorationsMapRef.current.clear();
            console.log("[Cleanup] Cleared all editor decorations.");
        }
        setEditorInstance(null); // Clear editor instance state
        setCollaborators([]); // Reset collaborators
        setCode(''); // Reset code
        codeRef.current = ''; // Reset code ref
        console.log(`%c[Cleanup] Frontend state reset for session ${sessionId}.`, 'color: gray;');
    };
}, [sessionId, currentUser]); // CRITICAL: Depend only on sessionId and currentUser for connection management

// Monaco Editor Did Mount Handler (Called ONCE when Editor component mounts)
// This handler sets up listeners that rely on the editor instance.
const handleEditorDidMount = useCallback((editor, monaco) => {
    setEditorInstance(editor);
    editorRef.current = editor;

    console.log("%c[Monaco] Editor mounted. Setting up local listeners.", 'color: blue;');

    if (codeRef.current) {
        editor.setValue(codeRef.current);
        console.log("[Monaco] Editor: Set initial value from codeRef on mount.");
    }

    editor.onDidChangeModelContent(() => {
        if (ignoreChangeRef.current) {
            return;
        }

        const updatedCode = editor.getValue();
        if (socketRef.current && socketRef.current.connected && updatedCode !== codeRef.current) {
            codeRef.current = updatedCode;
            setCode(updatedCode);
            socketRef.current.emit('code-change', updatedCode);
            console.log("%c[Socket EMIT] 'code-change' for local modification.", 'color: orange;');

            socketRef.current.emit('user-typing', { userId: currentUser.id, isTyping: true, userName: currentUser.firstName });
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit('user-typing', { userId: currentUser.id, isTyping: false, userName: currentUser.firstName });
                }
            }, 1000);
        }
    });

    editor.onDidChangeCursorSelection((e) => {
        if (socketRef.current && socketRef.current.connected) {
            const currentPosition = editor.getPosition();
            const currentSelection = editor.getSelection();

            socketRef.current.emit('cursor-change', {
                userId: currentUser.id,
                userName: currentUser.firstName,
                position: { lineNumber: currentPosition.lineNumber, column: currentPosition.column },
                selection: currentSelection.isEmpty() ? null : {
                    startLineNumber: currentSelection.startLineNumber,
                    startColumn: currentSelection.startColumn,
                    endLineNumber: currentSelection.endLineNumber,
                    endColumn: currentSelection.endColumn,
                    isEmpty: currentSelection.isEmpty()
                },
                timestamp: Date.now()
            });
        }
    });

}, [currentUser]); // currentUser is a stable dependency from useCallback

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
    console.log(`%c[Execution] Running code for problem ${problemDetails?._id}. Language: ${language}`, 'color: yellow;');
    setLoading(true);
    setRunResult(null);
    setActiveLeftTab('testcase');

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
                        status: result.status_id === 3 ? 'passed' : 'failed',
                        runtime: result.time || response.data.runtime,
                        memory: result.memory || response.data.memory,
                        error: result.stderr || result.compile_output || null
                    };
                }
                return testCase;
            });
            setTestCaseResults(updatedTestCases);
            console.log("[Execution] Updated test case results:", updatedTestCases);
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
    console.log(`%c[Submission] Submitting code for problem ${problemDetails?._id}. Language: ${language}`, 'color: yellow;');
    setLoading(true);
    setSubmitResult(null);
    setActiveLeftTab('result');

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
            passedTestCases: 0, totalTestCases: 0
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
    switch (lang) {
        case 'javascript': return 'javascript';
        case 'java': return 'java';
        case 'cpp': return 'cpp';
        case 'python': return 'python';
        default: return 'javascript';
    }
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

// --- Start of JSX Render ---
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
                                                    <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-x-auto">{testCase.output}</pre>
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
                                {/* `collaborators.length` is now the single source of truth for online count */}
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
                                            {/* Iterate `collaborators` state directly */}
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
                                                        {/* Display typing indicator based on collaborator's `isTyping` property */}
                                                        {collaborator.isTyping && (
                                                            <span className="loading loading-dots loading-xs text-primary"></span>
                                                        )}
                                                        {collaborator.id === currentUser.id && (
                                                            <span className="badge badge-primary badge-xs">You</span>
                                                        )}
                                                        {/* Make sure `isHost` is correctly set in `collaborators-update` from backend */}
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