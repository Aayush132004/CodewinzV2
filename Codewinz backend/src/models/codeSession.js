    // src/models/CodeSession.js
    const mongoose = require('mongoose');

    const codeSessionSchema = new mongoose.Schema({
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true // Index for fast lookup
        },
        problemId: { // Link to the problem (optional, can be null for general collaboration)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'problem', // Assuming your Problem model is named 'Problem'
            default: null
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user', // Assuming your User model is named 'User'
            required: true
        },
        creatorName: { // Storing name for easier display without extra lookups
            type: String,
            required: true
        },
       startCode:[
                {
        language:{
            type:String,
            required:true,
        },
        initialCode:{
            type:String,
            required:true,
        }
           }
        ],
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastModified: {
            type: Date,
            default: Date.now
        }
    });

    // Update lastModified timestamp on save
    codeSessionSchema.pre('save', function(next) {
        this.lastModified = Date.now();
        next();
    });

    const CodeSession = mongoose.models.codeSession||mongoose.model('codeSession', codeSessionSchema);

    module.exports = CodeSession;
