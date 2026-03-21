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
  return (
    <GoogleOAuthProvider clientId="521236653559-icfh5s0fvctl5ncl1cjuagbspj3533el.apps.googleusercontent.com">
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
