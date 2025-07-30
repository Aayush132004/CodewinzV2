const express = require('express');
const { v4: uuidv4 } = require('uuid');
const CodeSession = require('../models/CodeSession');
const authMiddleware = require('../middleware/userMiddleware');
const Problem = require('../models/problem');

// Track active sessions and users
const activeSessions = new Map(); // sessionId -> { users: Set<userId>, ... }

const router = express.Router();

// POST /code/create-session
router.post('/create-session', authMiddleware, async (req, res) => {
    try {
        req.user = req.result;
        if (!req.user || !req.user.id || !req.user.firstName) {
            return res.status(401).json({ message: 'Unauthorized: User not identified.' });
        }

        const sessionId = uuidv4();
        const { initialCode = '', language = 'javascript', problemId = null } = req.body;

        const newSession = new CodeSession({
            sessionId: sessionId,
            creatorId: req.user.id,
            creatorName: req.user.firstName,
            codeContent: initialCode,
            language: language,
            problemId: problemId
        });

        await newSession.save();

        // Initialize active session tracking
        activeSessions.set(sessionId, {
            users: new Set(),
            createdAt: new Date()
        });

        res.status(201).json({
            message: 'Collaborative session created successfully!',
            sessionId: sessionId,
            shareLink: `${process.env.FRONTEND_URL}/code/${sessionId}`
        });

    } catch (error) {
        console.error('Error creating collaborative session:', error);
        res.status(500).json({ message: 'Failed to create collaborative session.', error: error.message });
    }
});

// GET /code/:sessionId
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await CodeSession.findOne({ sessionId }).populate('problemId');
        if (!session) {
            return res.status(404).json({ message: 'Collaborative session not found.' });
        }

        // Get active users count for this session
        const activeSession = activeSessions.get(sessionId);
        const activeUsersCount = activeSession ? activeSession.users.size : 0;

        return res.status(200).json({
            sessionId: session.sessionId,
            creatorId: session.creatorId,
            creatorName: session.creatorName,
            codeContent: session.codeContent,
            language: session.language,
            createdAt: session.createdAt,
            lastModified: session.lastModified,
            problemDetails: session.problemId || null,
            activeUsersCount: activeUsersCount // Include active users count
        });

    } catch (error) {
        console.error('Error fetching collaborative session:', error);
        return res.status(500).json({
            message: 'Failed to fetch collaborative session.',
            error: error.message
        });
    }
});



module.exports = router;
