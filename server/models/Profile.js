const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    academic: {
        degree: { type: String, required: true },
        branch: { type: String, required: true },
        college: { type: String, required: true },
        gradYear: { type: Number, required: true }
    },
    experience: {
        skills: [String],
        experienceLevel: { type: String, enum: ['Fresher', '1-2 Years', '3+ Years'], default: 'Fresher' }
    },
    preferences: {
        preferredRoles: [String],
        locationPreference: { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Remote' },
        preferredCities: String,
        salaryRange: {
            min: Number,
            max: Number
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Profile', ProfileSchema);
