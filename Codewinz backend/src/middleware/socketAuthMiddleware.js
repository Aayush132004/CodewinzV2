// src/middleware/socketAuthMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Assuming this is your Mongoose User model
const redisClient = require("../config/redis"); // Your Redis client
const cookieParser = require('cookie-parser'); // Import cookie-parser


const parseCookies = cookieParser(process.env.COOKIE_SECRET || 'your_cookie_secret_fallback'); // Use your actual cookie secret if cookies are signed

const socketAuthMiddleware = async (socket, next) => {
   
    // Socket.IO's underlying Engine.IO connection uses HTTP requests for the handshake.
    // We can access the original HTTP request and its headers.
    const req = socket.request;

    // Apply cookie-parser to the request to parse the cookie header.
    // The `next` callback here is for the middleware chain, not the socket.io chain.
    parseCookies(req, {}, async (err) => {
        if (err) {
            console.error("Socket.IO: Cookie parsing error:", err.message);
            return next(new Error("Authentication error: Invalid cookie format"));
        }

        // IMPORTANT: Access the JWT token from the parsed cookies.
        // Replace 'token' with the actual name of the cookie where your backend stores the JWT.
        const token = req.cookies.token; // <--- This line is changed
        // console.log(token);

        if (!token) {
            console.log('Socket.IO: Authentication failed - No JWT token found in cookies.');
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            // Verify the token using your JWT secret key from environment variables
            const payload = jwt.verify(token, process.env.JWT_KEY);
            const { id } = payload; // Assuming your JWT payload has an 'id' field for the user

            if (!id) throw new Error("Invalid token payload: missing user ID");

            // Check if the token is blacklisted in Redis (for logout/revoked tokens)
            const isBlocked = await redisClient.exists(`token:${token}`);
            if (isBlocked) throw new Error("Token is blacklisted");

            // Fetch user details from your MongoDB using your User model
            const user = await User.findById(id);
            if (!user) throw new Error("User doesn't exist");

            // Attach authenticated user data to the socket object.
            // This data will be available as `socket.user` in your chat handlers.
            socket.user = {
                id: user._id.toString(), // Convert ObjectId to string
                firstName: user.firstName, // Use firstName as per your User model
                imageUrl: user.profile?.url || null // Assuming profile is an object with a url property
            };

            // console.log(`Socket.IO: User ${socket.user.firstName} (${socket.user.id}) connected.`);
            next(); // Allow the Socket.IO connection to proceed
        } catch (err) {
            console.error("Socket.IO: Authentication error -", err.message);
            next(new Error("Authentication error: " + err.message));
        }
    });
};

module.exports = socketAuthMiddleware;
