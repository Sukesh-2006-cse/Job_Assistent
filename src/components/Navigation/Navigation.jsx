import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, ClipboardList, TrendingUp, User, LogOut } from 'lucide-react';
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
                <Link to="/dashboard" className="nav-link">
                    <LayoutDashboard size={18} /> Butler
                </Link>
                <Link to="/discover" className="nav-link">
                    <Compass size={18} /> Discover
                </Link>
                <Link to="/applications" className="nav-link">
                    <ClipboardList size={18} /> My Applications
                </Link>
                <Link to="/career" className="nav-link">
                    <TrendingUp size={18} /> Career Butler
                </Link>
                <Link to="/profile" className="nav-link">
                    <User size={18} /> Profile
                </Link>
            </div>
            <div className="user-profile">
                <span className="user-name">Welcome, {user?.name || 'Explorer'}</span>
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navigation;
