import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <nav className="main-nav">
            <div className="logo" onClick={() => navigate('/dashboard')}>Apply-Flow</div>
            <div className="nav-links">
                <Link to="/dashboard" className="nav-link">Butler</Link>
                <Link to="/discover" className="nav-link">Discover</Link>
                <Link to="/applications" className="nav-link">My Applications</Link>
                <Link to="/career" className="nav-link">Career Butler</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
            </div>
            <div className="user-profile">
                <span className="user-name">Welcome, {user?.name || 'Explorer'}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
        </nav>
    );
};

export default Navigation;
