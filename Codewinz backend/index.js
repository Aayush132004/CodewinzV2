const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const cron = require("node-cron");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const main = require("./src/config/db");
const redisClient = require("./src/config/redis");
const User = require("./src/models/user");
const CodeSession = require('./src/models/codeSession');
const authMiddleware = require('./src/middleware/userMiddleware');
const socketAuthMiddleware = require("./src/middleware/socketAuthMiddleware");

// Import chat utility functions (using the working names from old code)
const { fetchChatMessages, saveChatMessage, clearOldChatMessages } = require('./src/utils/fetchChat');

// --- Import API Routes ---
const userAuth = require("./src/routes/userAuth");
const problemCreator = require("./src/routes/problemCreator");
const submit = require("./src/routes/submit");
const videoRouter = require('./src/routes/videoRouter');
const profileRouter = require("./src/routes/profile");
const aiRouter = require("./src/routes/aiChatting");
const contestRouter = require("./src/routes/contestRouter");
const codeCollaborationRouter = require('./src/routes/codeCollaboration');

const cors = require("cors");

// --- Main Express and Socket.IO setup ---
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"]
}));

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"]
    }
});

// A separate instance of cookie-parser for Socket.IO's internal use.
const cookieParserInstance = cookieParser(process.env.COOKIE_SECRET || 'your_cookie_secret_fallback');

// --- Your Existing API Routes ---
app.use("/user", userAuth);
app.use("/problem", problemCreator);
app.use("/submission", submit);
app.use("/video", videoRouter);
app.use("/profile", profileRouter);
app.use("/ai", aiRouter);
app.use("/contest", contestRouter);
app.use("/code", codeCollaborationRouter);


// --- Main Community Chat Logic (Root Namespace) - Using Working Logic from Old Code ---
const onlineUsersMap = new Map(); // Map<userId, { userDetails, Set<socketId> }>

const emitOnlineUsers = () => {
    const uniqueOnlineUsers = Array.from(onlineUsersMap.values()).map(userEntry => userEntry.userDetails);
    io.emit('online users', uniqueOnlineUsers);
    io.emit('users count', uniqueOnlineUsers.length);
    console.log(`Currently ${uniqueOnlineUsers.length} unique chat users online.`);
};

// Middleware to authenticate users for the main chat namespace
io.use(socketAuthMiddleware);

io.on('connection', async (socket) => {
    // This connection handler is for the main chat.
    // `socket.user` is populated by `socketAuthMiddleware`.
    const { id: userId, firstName, imageUrl } = socket.user;

    console.log(`User ${firstName} (${userId}) connected to main chat.`);

    if (!onlineUsersMap.has(userId)) {
        onlineUsersMap.set(userId, { userDetails: { id: userId, firstName, imageUrl }, socketIds: new Set() });
    }
    onlineUsersMap.get(userId).socketIds.add(socket.id);
    emitOnlineUsers();

    // Initial message load - using the working function name
    try {
        const initialMessages = await fetchChatMessages({ limit: 50 });
        socket.emit('load messages', initialMessages);
    } catch (dbError) {
        console.error("Error loading initial chat messages for new user:", dbError);
        socket.emit('chat error', 'Failed to load chat history.');
    }

    // Handle incoming chat messages
    socket.on('chat message', async (msg) => {
        if (typeof msg !== 'string' || msg.trim() === '') {
            console.log('Received empty or invalid message from', firstName);
            return;
        }

        const messageData = {
            user: { id: userId, firstName, imageUrl },
            text: msg.trim(),
            timestamp: new Date().toISOString()
        };

        try {
            const savedMessage = await saveChatMessage(messageData);
            io.emit('chat message', savedMessage);
            console.log(`[${firstName}] sent: "${msg}"`);
        } catch (dbError) {
            console.error("Error saving or broadcasting chat message:", dbError);
            socket.emit('chat error', 'Failed to send message. Please try again.');
        }
    });

    socket.on('disconnect', () => {
        const { id: userId, firstName } = socket.user;

        // Remove the specific socket.id from the user's set of active sockets
        if (onlineUsersMap.has(userId)) {
            onlineUsersMap.get(userId).socketIds.delete(socket.id);
            // If no more active sockets for this user, remove them from the map
            if (onlineUsersMap.get(userId).socketIds.size === 0) {
                onlineUsersMap.delete(userId);
            }
        }
        console.log(`User ${firstName} disconnected from main chat.`);
        emitOnlineUsers(); // Update online users list for all clients
    });

    socket.on('connect_error', (err) => {
        console.error(`Socket.IO Connection Error for socket ${socket.id}: ${err.message}`);
    });
});


// --- Collaborative Coding Namespace (`/code`) - Using Improved Logic from New Code ---
const codeIo = io.of('/code');

// Map to track active users in each code session room
const codeSessionUsers = new Map();

// Middleware for the '/code' namespace
codeIo.use(async (socket, next) => {
    const sessionId = socket.handshake.query.sessionId || socket.handshake.auth?.sessionId;
    if (!sessionId) {
        return next(new Error("Collaboration error: Session ID missing."));
    }

    try {
        const session = await CodeSession.findOne({ sessionId });
        if (!session) {
            return next(new Error("Collaboration error: Invalid session ID."));
        }
        socket.codeSession = session;

        const frontendUserId = socket.handshake.query.userId || socket.handshake.auth?.userId;
        const frontendFirstName = socket.handshake.query.firstName || socket.handshake.auth?.firstName;
        const frontendImageUrl = socket.handshake.query.imageUrl || socket.handshake.auth?.imageUrl;

        cookieParserInstance(socket.request, {}, async (err) => {
            if (err) {
                console.warn("Code Collab: Cookie parsing error:", err.message);
            }

            const token = socket.request.cookies.jwtToken;
            let authenticatedUser = null;

            if (token) {
                try {
                    const payload = jwt.verify(token, process.env.JWT_KEY);
                    const user = await User.findById(payload.id);
                    if (user) {
                        authenticatedUser = {
                            id: user._id.toString(),
                            firstName: user.firstName,
                            imageUrl: user.profile?.url || null,
                            isAuthenticated: true
                        };
                        console.log(`Code Collab: Authenticated user ${authenticatedUser.firstName} joined session ${sessionId}`);
                    }
                } catch (jwtErr) {
                    console.warn("Code Collab: JWT verification failed:", jwtErr.message);
                }
            }

            if (authenticatedUser) {
                socket.user = authenticatedUser;
            } else if (frontendUserId && frontendFirstName) {
                socket.user = {
                    id: frontendUserId,
                    firstName: frontendFirstName,
                    imageUrl: frontendImageUrl || null,
                    isAuthenticated: false
                };
                console.log(`Code Collab: Anonymous user ${socket.user.firstName} (${socket.user.id}) joined session ${sessionId}`);
            } else {
                socket.user = {
                    id: socket.id,
                    firstName: 'Anonymous',
                    imageUrl: null,
                    isAuthenticated: false
                };
                console.log(`Code Collab: Fallback anonymous user joined session ${sessionId}`);
            }

            next();
        });
    } catch (error) {
        console.error("Code Collab: Error during session validation:", error.message);
        next(new Error("Collaboration error: " + error.message));
    }
});

const emitSessionUsersUpdate = (sessionId, targetSocket = null) => {
    const sessionMap = codeSessionUsers.get(sessionId);
    if (!sessionMap) return;

    const currentSessionUsers = Array.from(sessionMap.values()).map(userEntry => ({
        id: userEntry.userId,
        firstName: userEntry.firstName,
        imageUrl: userEntry.imageUrl,
        isAuthenticated: userEntry.isAuthenticated,
        socketCount: userEntry.socketIds.size
    }));

    const dataToEmit = {
        users: currentSessionUsers,
        usersCount: currentSessionUsers.length
    };

    console.log(`Code Collab: Emitting collaborators update for session ${sessionId}:`, dataToEmit);

    if (targetSocket) {
        targetSocket.emit('collaborators-update', dataToEmit);
    } else {
        codeIo.to(sessionId).emit('collaborators-update', dataToEmit);
    }
};

const addUserToSession = (sessionId, userId, userDetails, socketId) => {
    if (!codeSessionUsers.has(sessionId)) {
        codeSessionUsers.set(sessionId, new Map());
    }

    const sessionMap = codeSessionUsers.get(sessionId);

    if (sessionMap.has(userId)) {
        sessionMap.get(userId).socketIds.add(socketId);
    } else {
        sessionMap.set(userId, {
            userId: userId,
            firstName: userDetails.firstName,
            imageUrl: userDetails.imageUrl,
            isAuthenticated: userDetails.isAuthenticated,
            socketIds: new Set([socketId])
        });
    }
};

const removeUserFromSession = (sessionId, userId, socketId) => {
    if (!codeSessionUsers.has(sessionId)) return;

    const sessionMap = codeSessionUsers.get(sessionId);
    if (!sessionMap.has(userId)) return;

    const userEntry = sessionMap.get(userId);
    userEntry.socketIds.delete(socketId);

    if (userEntry.socketIds.size === 0) {
        sessionMap.delete(userId);
    }

    if (sessionMap.size === 0) {
        codeSessionUsers.delete(sessionId);
    }
};

codeIo.on('connection', async (socket) => {
    const { sessionId } = socket.codeSession;
    const userDetails = socket.user;

    console.log(`${userDetails.firstName} (${userDetails.id}) connected to code session: ${sessionId} with socket ${socket.id}`);

    socket.join(sessionId);

    addUserToSession(sessionId, userDetails.id, userDetails, socket.id);

    emitSessionUsersUpdate(sessionId);

    socket.on('user-joined', (userData) => {
        console.log(`Code Collab: Received user-joined event:`, userData);

        if (userData && userData.userId) {
            const updatedUserDetails = {
                id: userData.userId,
                firstName: userData.firstName || userDetails.firstName,
                imageUrl: userData.imageUrl || userDetails.imageUrl,
                isAuthenticated: userDetails.isAuthenticated
            };

            removeUserFromSession(sessionId, userDetails.id, socket.id);
            socket.user = updatedUserDetails;
            addUserToSession(sessionId, updatedUserDetails.id, updatedUserDetails, socket.id);

            emitSessionUsersUpdate(sessionId);
        }
    });

    socket.on('load-code', () => {
        socket.emit('load-code', {
            code: socket.codeSession.codeContent,
            language: socket.codeSession.language,
            creatorName: socket.codeSession.creatorName,
        });
    });
    
    // Handle code changes from a client
    socket.on('code-change', async (newCode) => {
        try {
            await CodeSession.updateOne({ sessionId }, { codeContent: newCode, lastModified: new Date() });
            socket.to(sessionId).emit('code-change', newCode);
        } catch (error) {
            console.error(`Error updating code for session ${sessionId}:`, error);
            socket.emit('code-error', 'Failed to save code change.');
        }
    });

    // Handle language changes
    socket.on('language-change', async (languageData) => {
        try {
            const session = await CodeSession.findOne({ sessionId });
            if (!session) {
                return socket.emit('code-error', 'Session not found.');
            }

            let targetLanguage = languageData.language;
            if (targetLanguage === "cpp") {
                targetLanguage = "c++";
            }

            console.log("Language change request:", languageData, "-> Target:", targetLanguage);

            const boilerplateEntry = session.startCode.find(entry => entry.language === targetLanguage);
            const updatedCodeContent = languageData.codeContent || (boilerplateEntry ? boilerplateEntry.initialCode : session.codeContent);

            await CodeSession.updateOne({ sessionId }, {
                language: targetLanguage,
                codeContent: updatedCodeContent,
                lastModified: new Date()
            });

            codeIo.to(sessionId).emit('language-change', {
                language: targetLanguage,
                codeContent: updatedCodeContent
            });

        } catch (error) {
            console.error(`Error updating language for session ${sessionId}:`, error);
            socket.emit('code-error', 'Failed to update language.');
        }
    });

    // Handle cursor/selection changes
    socket.on('cursor-change', (cursorData) => {
        const enhancedCursorData = {
            userId: userDetails.id,
            userName: userDetails.firstName,
            userImageUrl: userDetails.imageUrl,
            socketId: socket.id,
            ...cursorData,
            timestamp: Date.now()
        };
        socket.to(sessionId).emit('cursor-change', enhancedCursorData);
    });

    // Handle user typing status
    socket.on('user-typing', (data) => {
        socket.to(sessionId).emit('user-typing', {
            userId: userDetails.id,
            userName: userDetails.firstName,
            isTyping: data.isTyping
        });
    });

    socket.on('disconnect', () => {
        const { sessionId } = socket.codeSession;
        const { id: userId, firstName } = userDetails;

        console.log(`${firstName} (${userId}) disconnected from code session: ${sessionId} (socket: ${socket.id})`);

        removeUserFromSession(sessionId, userId, socket.id);

        emitSessionUsersUpdate(sessionId);

        if (!codeSessionUsers.has(sessionId)) {
            console.log(`Code session ${sessionId} is now empty.`);
        }
    });

    socket.on('connect_error', (err) => {
        console.error(`Socket.IO Connection Error for socket ${socket.id}: ${err.message}`);
    });
});


// --- Initialize Database Connections and Start Server ---
const InitializeConnection = async () => {
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("DB Connected");

        server.listen(process.env.PORT, () => {
            console.log("Express server listening on port " + process.env.PORT);
            console.log("Socket.IO server is also running on the same port.");

            cron.schedule('0 0 * * *', async () => {
                console.log('Running scheduled chat cleanup...');
                try {
                    await clearOldChatMessages(24);
                } catch (error) {
                    console.error('Scheduled chat cleanup failed:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            });
            console.log("Chat cleanup scheduled to run daily at midnight.");
        });
    } catch (err) {
        console.log("Error during server initialization: " + err);
        process.exit(1);
    }
};

InitializeConnection();