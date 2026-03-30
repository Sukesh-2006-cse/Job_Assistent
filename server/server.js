const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./models/User');
const Profile = require('./models/Profile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const jobRoutes = require('./src/routes/jobs');
const butlerRoutes = require('./src/routes/butler');
const profileRoutes = require('./src/routes/profile');
const discoverRoutes = require('./src/routes/discover');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        // Start scheduler
        require('./src/jobs/scheduler');
    })
    .catch(err => console.error('MongoDB connection error:', err));

// --- Auth Routes ---

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User already exists' });

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
        const { email, name, sub } = req.body;
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                name,
                email,
                password: await bcrypt.hash(sub + JWT_SECRET, 10),
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

// Routes
app.use('/api/job-tracker', jobRoutes);
app.use('/api/butler', butlerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/discover', discoverRoutes);

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
