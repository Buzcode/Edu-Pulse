import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const navigate = useNavigate();

    // --- ACTIONS ---
    const approveTeacher = async (id) => {
        try {
            await API.post(`/Auth/approve-teacher/${id}`);
            setPendingTeachers(prev => prev.filter(t => t.id !== id));
            alert('Teacher Approved Successfully!');
        } catch (error) {
            console.error(error);
            alert('Approval failed.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- EFFECTS ---

    // 1. Fetch Pending Teachers (Admin Only)
    useEffect(() => {
        if (user?.role !== 'Admin') return;
        let cancelled = false;

        API.get('/Auth/pending-teachers')
            .then(res => {
                if (!cancelled) setPendingTeachers(res.data);
            })
            .catch(err => console.error('Failed to fetch teachers:', err));

        return () => { cancelled = true; };
    }, [user?.role]);

    // 2. Fetch Courses (Student & Teacher)
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        if (user.role === 'Teacher' || user.role === 'Student') {
            API.get('/Courses')
                .then(res => {
                    if (!cancelled) setMyCourses(res.data);
                })
                .catch(err => console.error('Error fetching courses', err));
        }

        return () => { cancelled = true; };
    }, [user]);

    // --- RENDER HELPERS ---
    if (!user) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="header-strip">
                <h1>EduPulse</h1>
                <button onClick={handleLogout} className="btn-logout">
                    Logout
                </button>
            </div>

            {/* User Info Card */}
            <div className="user-info-card">
                <h2>Welcome, {user.name}!</h2>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Department:</strong> {user.department}</p>
                {user.role === 'Student' && (
                    <p><strong>Standing:</strong> Year {user.year}, Semester {user.semester}</p>
                )}
            </div>

            {/* --- ADMIN SECTION --- */}
            {user.role === 'Admin' && (
                <div className="admin-section">
                    <h3>Pending Teacher Approvals</h3>
                    {pendingTeachers.length === 0 ? (
                        <p>No pending teachers to approve at this time.</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingTeachers.map(t => (
                                    <tr key={t.id}> {/* ✅ KEY PROP IS CORRECT HERE */}
                                        <td>{t.name}</td>
                                        <td>{t.email}</td>
                                        <td>
                                            <button
                                                onClick={() => approveTeacher(t.id)}
                                                className="btn-approve"
                                            >
                                                Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* --- COURSES SECTION --- */}
            {(user.role === 'Student' || user.role === 'Teacher') && (
                <div className="courses-section">
                    <div className="courses-header">
                        <h3>{user.role === 'Teacher' ? "Courses You Teach" : "Your Enrolled Courses"}</h3>
                        {user.role === 'Teacher' && (
                            <button className="btn-approve" onClick={() => navigate('/teacher-courses')}>
                                + Create/Sync Course
                            </button>
                        )}
                    </div>

                    <div className="courses-grid">
                        {myCourses.length === 0 ? (
                            <p>No courses found.</p>
                        ) : (
                            myCourses.map(course => (
                                <div
                                    key={course.id} /* ✅ KEY PROP IS CORRECT HERE */
                                    className="course-card"
                                    onClick={() => navigate(`/course-content/${course.id}`)}
                                >
                                    <h4 className="course-code">{course.code}</h4>
                                    <p><strong>{course.title}</strong></p>
                                    <p className="course-subtext">
                                        {user.role === 'Teacher' ? `Target: ${course.deptName}` : `Teacher: ${course.teacherName}`}
                                    </p>
                                    <span className="course-year-sem">
                                        Year {course.year} Sem {course.semester}
                                    </span>

                                    {/* TEACHER ACTIONS */}
                                    {user.role === 'Teacher' && (
                                        <div
                                            className="course-card-actions"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ marginTop: '15px', display: 'flex', gap: '10px' }}
                                        >
                                            <button
                                                onClick={() => navigate(`/course/${course.id}/gradebook`)}
                                                className="btn-approve"
                                                style={{ flex: 1, backgroundColor: '#6b46c1' }}
                                            >
                                                📊 Gradebook
                                            </button>

                                            <button
                                                onClick={() => navigate(`/attendance-sheet/${course.id}`)}
                                                className="btn-secondary"
                                                style={{ flex: 1, backgroundColor: '#17a2b8' }}
                                            >
                                                📅 Attendance
                                            </button>
                                        </div>
                                    )}

                                    {/* STUDENT ACTIONS */}
                                    {user.role === 'Student' && (
                                        <div
                                            className="course-card-actions"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ marginTop: '15px' }}
                                        >
                                            <button
                                                onClick={() => navigate(`/student/result/${course.id}`)}
                                                className="btn-approve"
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#2ecc71',
                                                    border: 'none',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    padding: '8px',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                📊 View Result
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;