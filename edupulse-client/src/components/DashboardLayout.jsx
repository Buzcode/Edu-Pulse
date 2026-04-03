import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return <div className="loading-screen">Loading...</div>;

    return (
        <div className={`layout-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* --- SIDEBAR --- */}
            <aside className="app-sidebar">
                <div className="sidebar-header">
                    <div className="header-left">
                        <div className="logo-circle">EP</div>
                        {!isCollapsed && <span className="brand-name">EduPulse</span>}
                    </div>
                    <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                        {isCollapsed ? '➡' : '☰'}
                    </button>
                </div>

                <nav className="sidebar-menu">
                    {/* 🏠 USER HOME (Dashboard Card) */}
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <span className="nav-icon"></span>
                        {!isCollapsed && <span className="nav-text">User Home</span>}
                    </NavLink>

                    {/* --- STUDENT SPECIFIC --- */}
                    {user.role === 'Student' && (
                        <>
                  
                            <NavLink to="/enrolled-courses" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Enrolled Courses</span>}
                            </NavLink>
                            <NavLink to="/results" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Result</span>}
                            </NavLink>
                            
                            <NavLink to="/clearance" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Clearance & Carry</span>}
                            </NavLink>

                        </>
                    )}

                    {/* --- TEACHER SPECIFIC --- */}
                    {user.role === 'Teacher' && (
                        <>
                            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Teacher Profile</span>}
                            </NavLink>

                            {/* My Courses Logic */}
                            <NavLink
                                to="/teacher-courses"
                                className={({ isActive }) =>
                                    (isActive && location.search !== '?mode=grading') ? "nav-item active" : "nav-item"
                                }
                            >
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Active Courses</span>}
                            </NavLink>

                            {/* Archived Courses */}
                            <NavLink
                                to="/archived-courses"
                                className={({ isActive }) =>
                                    isActive ? "nav-item active" : "nav-item"
                                }
                            >
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Archived Courses</span>}
                            </NavLink>


                            {/* Grade Results Logic */}
                            <NavLink
                                to="/teacher-courses?mode=grading"
                                className={() =>
                                    location.search === '?mode=grading' ? "nav-item active" : "nav-item"
                                }
                            >
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Grade Results</span>}
                            </NavLink>
                        </>
                    )}

                    {/* --- ADMIN SPECIFIC --- */}
                    {user.role === 'Admin' && (
                        <>
                            <NavLink to="/admin/batch-promotion" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Batch Promotion</span>}
                            </NavLink>

                            {/* NEW: Teacher Approvals Link */}
                            <NavLink to="/admin/teacher-approvals" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <span className="nav-icon"></span>
                                {!isCollapsed && <span className="nav-text">Teacher Approvals</span>}
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="btn-logout-sidebar">
                        {isCollapsed ? '🚪' : 'Logout'}
                    </button>
                </div>
            </aside>

            {/* --- MAIN VIEWPORT --- */}
            <main className="main-viewport">
                <header className="top-nav">
                    <div className="top-nav-left"><span className="portal-tag">{user.role} Portal</span></div>
                    <div className="top-nav-right">
                        <span className="user-name-top" style={{ marginRight: '10px', fontWeight: '500' }}>{user.name}</span>
                        <div className="user-avatar-small">{user.name.charAt(0)}</div>
                    </div>
                </header>

                <section className="content-area">
                    {children}
                </section>

                <footer className="app-footer">
                    2026 © - EduPulse Management System
                </footer>
            </main>
        </div>
    );
};

export default DashboardLayout;