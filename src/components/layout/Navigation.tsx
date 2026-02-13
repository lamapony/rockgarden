/**
 * Navigation - Stonewall Design
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart2, Settings } from 'lucide-react';
import './Navigation.css';

export function Navigation() {
    const location = useLocation();
    
    // Hide navigation on auth page and editor
    if (location.pathname === '/new' || location.pathname.startsWith('/entry/')) {
        return null;
    }

    return (
        <nav className="main-nav">
            <NavLink 
                to="/" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
            >
                <Home size={20} />
                <span className="nav-text">Log</span>
            </NavLink>

            <NavLink 
                to="/analysis" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
                <BarChart2 size={20} />
                <span className="nav-text">Analysis</span>
            </NavLink>

            <NavLink 
                to="/settings" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
                <Settings size={20} />
                <span className="nav-text">Settings</span>
            </NavLink>
        </nav>
    );
}
