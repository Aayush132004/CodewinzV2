// src/models/ChatMessage.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    user: {
        id: { type: String, required: true }, // User's unique ID (from your User model _id)
        firstName: { type: String, required: true }, // User's display name (matching your socket.user.firstName)
        imageUrl: { type: String, default: null } // User's profile picture URL
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500 // Limit message length to 500 characters
    },
    timestamp: {
        type: Date,
        default: Date.now // Automatically set creation time
    }
}, {
    timestamps: false // We are manually managing `timestamp` with Date.now()
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;