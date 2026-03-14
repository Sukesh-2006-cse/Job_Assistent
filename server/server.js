const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/User');
const Profile = require('./models/Profile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// API Config
const ADZUNA_ID = process.env.ADZUNA_ID;
const ADZUNA_KEY = process.env.ADZUNA_KEY;
const JSEARCH_KEY = process.env.JSEARCH_KEY;
const MUSE_KEY = process.env.MUSE_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Auth Routes ---

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user._id, name, email, isOnboarded: false } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email, isOnboarded: user.isOnboarded } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Google Auth (Social)
app.post('/api/google-auth', async (req, res) => {
    try {
        const { email, name, sub } = req.body; // sub is from google sub id

        let user = await User.findOne({ email });

        if (!user) {
            // Create user if they don't exist
            // No password for google users, we can use a generated one or just leave it handle differently
            user = new User({
                name,
                email,
                password: await bcrypt.hash(sub + JWT_SECRET, 10), // Deterministic "password" for social users
                isOnboarded: false
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email, isOnboarded: user.isOnboarded } });
    } catch (error) {
        res.status(500).json({ error: 'Google Auth failed' });
    }
});

// --- Onboarding Routes ---

app.post('/api/onboarding', async (req, res) => {
    try {
        const {
            userId, // Passed from frontend for now, in a real app would use auth middleware
            degree, branch, college, gradYear,
            skills, experienceLevel,
            preferredRoles, locationPreference, preferredCities, minSalary, maxSalary
        } = req.body;

        const newProfile = new Profile({
            userId,
            academic: { degree, branch, college, gradYear },
            experience: { skills, experienceLevel },
            preferences: {
                preferredRoles,
                locationPreference,
                preferredCities,
                salaryRange: { min: minSalary, max: maxSalary }
            }
        });

        await newProfile.save();

        // Update user status
        await User.findByIdAndUpdate(userId, { isOnboarded: true });

        res.status(201).json({ message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

app.get('/api/profiles/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`Fetching profile for userId: ${userId}`);

        if (!userId || userId === 'undefined') {
            return res.status(400).json({ error: 'Invalid User ID provided' });
        }

        const profile = await Profile.findOne({ userId });
        if (!profile) {
            console.log(`Profile not found for userId: ${userId}`);
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// --- Job Aggregator Routes ---

const fetchJSearchJobs = async (query) => {
    try {
        const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
            params: { query, page: '1', num_pages: '1' },
            headers: {
                'X-RapidAPI-Key': JSEARCH_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });
        return response.data.data.map(job => ({
            id: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            location: `${job.job_city || ''} ${job.job_country || ''}`,
            type: job.job_employment_type,
            url: job.job_apply_link,
            source: 'JSearch (LinkedIn/Indeed)',
            logo: job.employer_logo,
            description: job.job_description?.substring(0, 200) + '...'
        }));
    } catch (error) {
        console.error('JSearch Error:', error.message);
        return [];
    }
};

const fetchAdzunaJobs = async (query) => {
    try {
        const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/in/search/1`, {
            params: {
                app_id: ADZUNA_ID,
                app_key: ADZUNA_KEY,
                results_per_page: 10,
                what: query
            }
        });
        return response.data.results.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            type: job.contract_type || 'Full-time',
            url: job.redirect_url,
            source: 'Adzuna',
            logo: null,
            description: job.description?.substring(0, 200) + '...'
        }));
    } catch (error) {
        console.error('Adzuna Error:', error.message);
        return [];
    }
};

const fetchRemotiveJobs = async (query) => {
    try {
        const response = await axios.get(`https://remotive.com/api/remote-jobs`, {
            params: { search: query, limit: 10 }
        });
        return response.data.jobs.map(job => ({
            id: job.id.toString(),
            title: job.title,
            company: job.company_name,
            location: 'Remote',
            type: job.job_type,
            url: job.url,
            source: 'Remotive',
            logo: job.company_logo,
            description: job.description?.substring(0, 200).replace(/<[^>]*>/g, '') + '...'
        }));
    } catch (error) {
        console.error('Remotive Error:', error.message);
        return [];
    }
};

const fetchMuseJobs = async (query) => {
    try {
        const response = await axios.get(`https://www.themuse.com/api/public/jobs`, {
            params: { category: query, page: 0 }
        });
        return response.data.results.map(job => ({
            id: job.id.toString(),
            title: job.name,
            company: job.company.name,
            location: job.locations[0]?.name || 'On-site',
            type: 'Full-time',
            url: job.refs.landing_page,
            source: 'The Muse',
            logo: null,
            description: 'Company culture focused job listing.'
        }));
    } catch (error) {
        console.error('Muse Error:', error.message);
        return [];
    }
};

app.get('/api/jobs', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });

    try {
        // Fetch from all sources in parallel
        const [jSearch, adzuna, remotive, muse] = await Promise.all([
            fetchJSearchJobs(query),
            fetchAdzunaJobs(query),
            fetchRemotiveJobs(query),
            fetchMuseJobs(query)
        ]);

        const allJobs = [...jSearch, ...adzuna, ...remotive, ...muse];
        res.json(allJobs);
    } catch (error) {
        console.error('Aggregator Error:', error);
        res.status(500).json({ error: 'Failed to aggregate jobs' });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: `Not Found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
