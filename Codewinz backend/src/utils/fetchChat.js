// src/utils/fetchChat.js
const ChatMessage = require('../models/ChatMessage'); // Adjust path if necessary

const fetchChatMessages = async ({ limit = 50, beforeTimestamp } = {}) => {
    try {
        let query = {};
        if (beforeTimestamp) {
            
            query.timestamp = { $lt: beforeTimestamp };
        }

        const messages = await ChatMessage.find(query)
            .sort({ timestamp: -1 }) // Sort by newest first
            .limit(limit) // Limit the number of messages
            .lean(); // Return plain JavaScript objects for better performance

        // Reverse the array to have the oldest messages first for display in chat UI (chronological order)
        return messages.reverse();
    } catch (error) {
        console.error("Error fetching chat messages from MongoDB:", error);
        // Re-throw the error so the calling function can handle it.
        throw new Error("Failed to fetch chat messages from database.");
    }
};


const saveChatMessage = async (messageData) => {
    try {
        const newMessage = new ChatMessage({
            user: {
                id: messageData.user.id,
                firstName: messageData.user.firstName, // Ensure this matches your socket.user structure
                imageUrl: messageData.user.imageUrl
            },
            text: messageData.text,
            timestamp: messageData.timestamp ? new Date(messageData.timestamp) : undefined // Use provided or default
        });
        const savedMessage = await newMessage.save();
        return savedMessage.toObject(); // Return a plain object with MongoDB _id and actual timestamp
    } catch (error) {
        console.error("Error saving chat message to MongoDB:", error);
        throw new Error("Failed to save chat message to database.");
    }
};

module.exports = {
    fetchChatMessages,
    saveChatMessage
};
