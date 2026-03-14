import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthPage from './components/AuthPage';
import OnboardingPage from './components/Onboarding/OnboardingPage';
import DiscoverPage from './components/Discover/DiscoverPage';

function App() {
  return (
    <GoogleOAuthProvider clientId="521236653559-icfh5s0fvctl5ncl1cjuagbspj3533el.apps.googleusercontent.com">
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
