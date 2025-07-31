const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app=express();
const cron = require('node-cron');
require("dotenv").config();
const main = require("./src/config/db");
const cookieParser = require('cookie-parser');
const userAuth=require("./src/routes/userAuth")
const redisClient=require("./src/config/redis")
const problemCreator=require("./src/routes/problemCreator")
const submit=require("./src/routes/submit")
const cors=require("cors");
const videoRouter=require('./src/routes/videoRouter');
const profileRouter=require("./src/routes/profile");
const aiRouter=require("./src/routes/aiChatting");
const contestRouter=require("./src/routes/contestRouter");
///solving cors issue by allowing our frontend
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"]
}))

// Import new code collaboration route and model
const codeCollaborationRouter = require('./src/routes/codeCollaboration');
const CodeSession = require('./src/models/codeSession'); // Import the new CodeSession model

// Import chat utility functions
const { fetchChatMessages, saveChatMessage, clearOldChatMessages } = require('./src/utils/fetchChat');

// Import Socket.IO authentication middleware
const socketAuthMiddleware = require("./src/middleware/socketAuthMiddleware");
// Create a separate instance of cookie-parser for Socket.IO's internal use
// This is needed for the /code namespace middleware to parse cookies.
const cookieParserInstance = cookieParser(process.env.COOKIE_SECRET || 'your_cookie_secret_fallback');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"]
    }
});



app.use(express.json());
app.use(cookieParser()); // Ensure cookie-parser is used for Express routes



// --- Your Existing API Routes ---
app.use("/user", userAuth);
app.use("/problem", problemCreator);
app.use("/submission", submit);
app.use("/video", videoRouter);
app.use("/profile", profileRouter);
app.use("/ai", aiRouter);
app.use("/contest", contestRouter);

// --- New Code Collaboration Routes ---
app.use("/code", codeCollaborationRouter);

// --- Apply Socket.IO Authentication Middleware for Main Chat ---
// This middleware authenticates connections to the default namespace (for chat).
io.use(socketAuthMiddleware);

// --- Online Users Tracking (for Main Chat) ---
const onlineUsersMap = new Map(); // Map<userId, { userDetails, Set<socketId> }>

const emitOnlineUsers = () => {
    const uniqueOnlineUsers = Array.from(onlineUsersMap.values()).map(userEntry => userEntry.userDetails);
    io.emit('online users', uniqueOnlineUsers);
    io.emit('users count', uniqueOnlineUsers.length);
    console.log(`Currently ${uniqueOnlineUsers.length} unique chat users online.`);
};

// --- Socket.IO Event Handling for Main Chat ---
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

    try {
        const initialMessages = await fetchChatMessages({ limit: 50 });
        socket.emit('load messages', initialMessages);
    } catch (dbError) {
        console.error("Error loading initial chat messages for new user:", dbError);
        socket.emit('chat error', 'Failed to load chat history.');
    }

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


// --- Socket.IO Event Handling for Collaborative Coding (New Namespace) ---
// This handles connections to specific collaborative coding sessions.
// It uses a separate namespace and a different middleware for flexible authentication (anonymous allowed).
const codeIo = io.of('/code'); // Create a separate namespace for coding collaboration

// Middleware for the '/code' namespace for session validation (can be anonymous)
codeIo.use(async (socket, next) => {
    // Session ID can come from query parameter (for share link) or auth object (if explicitly passed)
    const sessionId = socket.handshake.query.sessionId || socket.handshake.auth?.sessionId;

    if (!sessionId) {
        return next(new Error("Collaboration error: Session ID missing."));
    }

    try {
        const session = await CodeSession.findOne({ sessionId });
        if (!session) {
            return next(new Error("Collaboration error: Invalid session ID."));
        }

        // Attach session data to the socket object
        socket.codeSession = session;

        // Attempt to get user data if a JWT is present in cookies (for logged-in collaborators)
        // This re-uses the cookie parsing logic from your main `cookieParserInstance`.
        cookieParserInstance(socket.request, {}, async (err) => {
            if (err) {
                console.warn("Code Collab: Cookie parsing error for potential user:", err.message);
                // Don't block connection if cookie parsing fails, just means no user data.
            }

            const token = socket.request.cookies.jwtToken; // Your JWT cookie name (e.g., 'jwtToken')
            if (token) {
                try {
                    const jwt = require("jsonwebtoken"); // Ensure jwt is available
                    const User = require("./src/models/"); // Ensure User model is available
                    const payload = jwt.verify(token, process.env.JWT_KEY);
                    const user = await User.findById(payload.id);
                    if (user) {
                        socket.user = {
                            id: user._id.toString(),
                            firstName: user.firstName,
                            imageUrl: user.profile?.url || null
                        };
                        console.log(`Code Collab: Authenticated user ${socket.user.firstName} joined session ${sessionId}`);
                    }
                } catch (jwtErr) {
                    console.warn("Code Collab: JWT verification failed for potential user:", jwtErr.message);
                }
            } else {
                console.log(`Code Collab: Anonymous user joined session ${sessionId}`);
            }
            next(); // Allow the connection
        });

    } catch (error) {
        console.error("Code Collab: Error during session validation:", error.message);
        next(new Error("Collaboration error: " + error.message));
    }
});

// Map to track active users in each code session room
// Map<sessionId, Map<socketId, { userId, firstName, imageUrl }>>
const codeSessionUsers = new Map();

codeIo.on('connection', async (socket) => {
    const { sessionId } = socket.codeSession;
    // Ensure userDetails always has a unique ID, even for anonymous users
    const userDetails = socket.user || { id: socket.id, firstName: 'Anonymous', imageUrl: null };
    // Add socket.id to userDetails for clearer tracking on the client side if needed
    userDetails.socketId = socket.id;

    console.log(`${userDetails.firstName} (${userDetails.id}) connected to code session: ${sessionId}`);

    socket.join(sessionId);

    // Track users in this specific session
    if (!codeSessionUsers.has(sessionId)) {
        codeSessionUsers.set(sessionId, new Map());
    }
    codeSessionUsers.get(sessionId).set(socket.id, userDetails);

    // Function to get and broadcast current users in a session
    const emitSessionUsersUpdate = (targetSocket = null) => {
        const sessionMap = codeSessionUsers.get(sessionId);
        if (!sessionMap) return; // Session might have been cleaned up if last user left

        const currentSessionUsers = Array.from(sessionMap.values());
        const currentSessionUserCount = currentSessionUsers.length;

        const dataToEmit = {
            users: currentSessionUsers,
            usersCount: currentSessionUserCount
        };

        if (targetSocket) {
            // Emit to a specific socket (e.g., on initial connect)
            targetSocket.emit('collaborators-update', dataToEmit);
        } else {
            // Broadcast to everyone in the room
            codeIo.to(sessionId).emit('collaborators-update', dataToEmit);
        }
    };

    // Emit initial code content and users to the new client
    socket.emit('load-code', {
        code: socket.codeSession.codeContent,
        language: socket.codeSession.language,
        creatorName: socket.codeSession.creatorName,
        // No need to send users/count here, 'collaborators-update' will handle it
    });

    // Send the full updated list of users to the newly connected client
    emitSessionUsersUpdate(socket);

    // Inform others in the room that a user has joined
    socket.to(sessionId).emit('user-joined', userDetails);


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

    // Handle cursor/selection changes from a client
    socket.on('cursor-change', (cursorData) => {
        const enhancedCursorData = {
            userId: userDetails.id, // Unique user ID
            userName: userDetails.firstName,
            userImageUrl: userDetails.imageUrl, // Send image URL for avatar if available
            socketId: userDetails.socketId, // The specific socket that sent the cursor update
            ...cursorData,
            timestamp: Date.now()
        };
        socket.to(sessionId).emit('cursor-change', enhancedCursorData);
    });

    // Handle user typing status
    socket.on('user-typing', (data) => {
        socket.to(sessionId).emit('user-typing', {
            userId: userDetails.id,
            userName: userDetails.firstName, // Include name for displaying "X is typing..."
            isTyping: data.isTyping
        });
    });

    socket.on('language-change', async (newLanguage) => {
        try {
            await CodeSession.updateOne({ sessionId }, { language: newLanguage });
            socket.to(sessionId).emit('language-change', newLanguage);
        } catch (error) {
            console.error(`Error updating language for session ${sessionId}:`, error);
            socket.emit('code-error', 'Failed to update language.');
        }
    });

    socket.on('disconnect', () => {
        const { sessionId } = socket.codeSession;
        const { id: userId, firstName } = userDetails;

        console.log(`${firstName} (${userId}) disconnected from code session: ${sessionId}`);

        if (codeSessionUsers.has(sessionId)) {
            const sessionMap = codeSessionUsers.get(sessionId);
            sessionMap.delete(socket.id); // Remove by socket.id

            // Broadcast user left event (with userId)
            socket.to(sessionId).emit('user-left', userId); // Send userId for frontend to remove cursor/typing indicator

            // Emit the updated list of collaborators
            emitSessionUsersUpdate();

            // Clean up empty sessions
            if (sessionMap.size === 0) {
                codeSessionUsers.delete(sessionId);
                console.log(`Code session ${sessionId} is now empty.`);
            }
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

            // Schedule the chat cleanup task to run daily at midnight
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