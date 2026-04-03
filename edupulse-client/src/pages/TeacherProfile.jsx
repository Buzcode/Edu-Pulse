import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const TeacherProfile = () => {
    const { user } = useContext(AuthContext);
    return (
        <div className="profile-page-container">
            <h2 className="page-title">Teacher Profile</h2>
            <div className="profile-layout-grid">
                <div className="profile-main-tabs">
                    <div className="tab-header"><button className="tab-btn active">Professional Info</button></div>
                    <div className="tab-content">
                        <table className="details-table">
                            <tbody>
                                <tr><td className="field-label">Full Name</td><td>{user.name}</td></tr>
                                <tr><td className="field-label">Department</td><td>{user.department}</td></tr>
                                <tr><td className="field-label">Office Room</td><td>Room 402, Building A</td></tr>
                                <tr><td className="field-label">Educational Qualification</td><td>M.Sc in {user.department}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="profile-side-card">
                    <div className="side-avatar-box">👨‍🏫</div>
                    <div className="side-info-row"><span>Teacher Id</span><strong>{user.email.split('@')[0]}</strong></div>
                    <div className="side-info-row"><span>Status</span><strong>Active Faculty</strong></div>
                </div>
            </div>
        </div>
    );
};
export default TeacherProfile;