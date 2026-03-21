const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    appliedDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        default: 'Applied',
        enum: ['Applied', 'Interview', 'Offer', 'Rejected']
    },
    platform: {
        type: String,
        default: 'Other'
    },
    notes: {
        type: String,
        default: ''
    },
    priority: {
        type: String,
        default: 'Medium'
    },
    nextAction: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
