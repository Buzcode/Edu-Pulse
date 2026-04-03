import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    if (!user) return <div className="loading-screen">Loading Profile...</div>;

    return (
        <div className="iums-home-container">
            {/* --- IUMS PROFILE CARD --- */}
            <div className="iums-home-card">
                <div className="iums-avatar-section">
                    <div className="iums-green-circle">
                        <span className="avatar-icon-svg">👤</span>
                    </div>
                </div>

                <table className="iums-display-table">
                    <tbody>
                        <tr>
                            <td className="iums-label">Name</td>
                            <td className="iums-value">{user.name?.toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td className="iums-label">{user.role} Id</td>
                            <td className="iums-value">{user.email.split('@')[0]}</td>
                        </tr>
                        <tr>
                            <td className="iums-label">Dept./School</td>
                            <td className="iums-value">Department of {user.department}</td>
                        </tr>

                        {/* --- STUDENT ONLY FIELDS --- */}
                        {user.role === 'Student' && (
                            <>
                                <tr>
                                    <td className="iums-label">Year/ Semester</td>
                                    <td className="iums-value">{user.year}/{user.semester}</td>
                                </tr>
                               
                            </>
                        )}

                        {/* --- TEACHER ONLY FIELDS --- */}
                        {user.role === 'Teacher' && (
                            <tr>
                                <td className="iums-label">Designation</td>
                                <td className="iums-value">Lecturer / Faculty Member</td>
                            </tr>
                        )}

                        {/* --- ADMIN ONLY FIELDS --- */}
                        {user.role === 'Admin' && (
                            <tr>
                                <td className="iums-label">Access Level</td>
                                <td className="iums-value">System Administrator (Full Access)</td>
                            </tr>
                        )}

                    </tbody>
                </table>
            </div>

            <footer className="iums-card-footer">
                2026 © - {user.department} University of Science and Technology
            </footer>
        </div>
    );
};

export default Dashboard;