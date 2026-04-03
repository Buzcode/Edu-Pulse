import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminProfile = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Identity');

    return (
        <div className="profile-page-container">
            <h2 className="page-title">System Administrator Profile</h2>

            {/* Alert bar like IUMS */}
            <div className="alert-info" style={{ backgroundColor: '#e8f5e9', borderColor: '#2d6a4f', color: '#1b4332' }}>
                System security check: Your last login was from IP 192.168.1.1. Please ensure 2FA is active.
            </div>

            <div className="profile-layout-grid">
                {/* Main Content Area */}
                <div className="profile-main-tabs">
                    <div className="tab-header" style={{ borderBottomColor: '#2d6a4f' }}>
                        {['Identity', 'System Access', 'Logs'].map(tab => (
                            <button
                                key={tab}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                                style={activeTab === tab ? { backgroundColor: '#2d6a4f' } : {}}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="tab-content">
                        {activeTab === 'Identity' && (
                            <table className="details-table">
                                <tbody>
                                    <tr><td className="field-label">Full Name</td><td>{user.name}</td></tr>
                                    <tr><td className="field-label">Official Email</td><td>{user.email}</td></tr>
                                    <tr><td className="field-label">Primary Department</td><td>{user.department}</td></tr>
                                    <tr><td className="field-label">Designation</td><td>Chief System Controller</td></tr>
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'System Access' && (
                            <table className="details-table">
                                <tbody>
                                    <tr><td className="field-label">Access Role</td><td><strong>Super Admin</strong></td></tr>
                                    <tr><td className="field-label">Module Permissions</td><td>All Modules (Read/Write)</td></tr>
                                    <tr><td className="field-label">Database Control</td><td>Enabled</td></tr>
                                    <tr><td className="field-label">Approval Authority</td><td>Full Batch Promotion & Teacher Approval</td></tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Side Summary Card */}
                <div className="profile-side-card">
                    <div className="side-avatar-box" style={{ background: '#2d6a4f' }}>⚙️</div>
                    <div className="side-info-row">
                        <span>Admin ID</span>
                        <strong>{user.email.split('@')[0]}</strong>
                    </div>
                    <div className="side-info-row">
                        <span>Role</span>
                        <strong style={{ color: '#2d6a4f' }}>SUPER USER</strong>
                    </div>
                    <div className="side-info-row">
                        <span>Department</span>
                        <strong>{user.department}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;