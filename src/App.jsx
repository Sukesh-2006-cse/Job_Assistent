import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import AuthPage from './components/AuthPage';
import OnboardingPage from './components/Onboarding/OnboardingPage';
import DiscoverPage from './components/Discover/DiscoverPage';
import Jobs from './pages/Applications/Applications';
import Dashboard from './pages/Dashboard/Dashboard';
import JobDetail from './pages/JobDetail/JobDetail';
import Profile from './pages/Profile/Profile';
import Career from './pages/Career/Career';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation/Navigation';

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId || clientId === 'your_google_client_id_here') {
    console.error('Google Client ID is missing. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
  } else {
    console.log('Google Client ID found and loaded.');
  }

  return (
    <GoogleOAuthProvider clientId={clientId || ''}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/discover" element={<PrivateRoute><DiscoverPage /></PrivateRoute>} />
            <Route path="/applications" element={<PrivateRoute><Jobs /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/career" element={<PrivateRoute><Career /></PrivateRoute>} />
            <Route path="/jobs/:id" element={<PrivateRoute><JobDetail /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
