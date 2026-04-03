import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const TeacherCourses = () => {
    useContext(AuthContext); // keep context call for ESLint
    const [courses, setCourses] = useState([]);
    const [newCourse, setNewCourse] = useState({
        title: '',
        code: '',
        targetDeptId: '',
        year: '',
        semester: ''
    });
    const [departments, setDepartments] = useState([]);
    const navigate = useNavigate();

    // --- MODE LOGIC ---
    const location = useLocation();
    // Detects if we are in "Grading Mode" via the URL query: /teacher-courses?mode=grading
    const isGradingMode = new URLSearchParams(location.search).get('mode') === 'grading';

    const fetchCourses = async () => {
        try {
            const res = await API.get('/Courses');
            setCourses(res.data);
        } catch (err) {
            console.error("Error fetching courses", err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const coursesRes = await API.get('/Courses');
                setCourses(coursesRes.data);

                const departmentsRes = await API.get('/Departments');
                setDepartments(departmentsRes.data);
            } catch (err) {
                console.error("Error loading data", err);
            }
        };

        loadData();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/Courses', newCourse);
            alert("Course Created Successfully!");
            setNewCourse({
                title: '',
                code: '',
                targetDeptId: '',
                year: '',
                semester: ''
            });
            fetchCourses();
        } catch {
            alert("Error creating course");
        }
    };

    const handleSync = async (id) => {
        try {
            const res = await API.post(`/Courses/sync/${id}`);
            alert(res.data.message);
        } catch {
            alert("Sync failed");
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="header-strip teacher-courses-header" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-action"
                    style={{
                        backgroundColor: '#52796f',
                        color: 'white',  /* Added quotes here */
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ← Back to Dashboard
                </button>
                <h2 style={{ color: '#1b4332', margin: 0 }}>
                    {isGradingMode ? "Select Course for Grading" : "Manage Your Courses"}
                </h2>
            </div>

            {/* Create Course Form - ONLY SHOW IF NOT IN GRADING MODE */}
            {!isGradingMode && (
                <form
                    onSubmit={handleCreate}
                    className="user-info-card teacher-course-form"
                    style={{ marginBottom: '40px', padding: '30px' }}
                >
                    <h3 style={{ color: '#2d6a4f', marginTop: 0, marginBottom: '20px' }}>Create New Course</h3>

                    <div className="form-group">
                        <input
                            placeholder="Course Title (e.g., Electrical Circuits II)"
                            value={newCourse.title}
                            onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <input
                            placeholder="Course Code (e.g., EEE 2101)"
                            value={newCourse.code}
                            onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <select
                            value={newCourse.targetDeptId}
                            onChange={e => setNewCourse({ ...newCourse, targetDeptId: e.target.value })}
                            required
                            className="form-input"
                        >
                            <option value="">Select Target Department</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="teacher-course-year-sem" style={{ display: 'flex', gap: '15px' }}>
                        <input
                            type="number"
                            placeholder="Year"
                            value={newCourse.year}
                            onChange={e => setNewCourse({ ...newCourse, year: e.target.value })}
                            required
                            className="form-input"
                        />
                        <input
                            type="number"
                            placeholder="Semester"
                            value={newCourse.semester}
                            onChange={e => setNewCourse({ ...newCourse, semester: e.target.value })}
                            required
                            className="form-input"
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '20px', padding: '12px' }}>
                        + Create Course
                    </button>
                </form>
            )}

            {/* Active Courses Table */}
            <div className="admin-section">
                <h3 style={{ color: '#2d6a4f', marginBottom: '20px' }}>
                    {isGradingMode ? "Active Grading Books" : "Your Active Courses"}
                </h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '10%' }}>Code</th>
                            <th style={{ width: '25%' }}>Title</th>
                            <th style={{ width: '25%' }}>Target Audience</th>
                            <th style={{ width: '40%', textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No courses created yet.</td></tr>
                        ) : (
                            courses.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 'bold' }}>{c.code}</td>
                                    <td style={{ fontWeight: '500' }}>{c.title}</td>
                                    <td>{c.deptName} (Y{c.year} S{c.semester})</td>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <div className="actions-cell" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                                            {/* ✅ NEW: GRADEBOOK BUTTON - SHOWS ONLY IN GRADING MODE */}
                                            {isGradingMode && (
                                                <button
                                                    onClick={() => navigate(`/course/${c.id}/gradebook`)}
                                                    className="btn-primary"
                                                    style={{
                                                        backgroundColor: '#6b46c1',
                                                        color: 'white',
                                                        padding: '10px 20px',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        width: 'auto',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    📊 Open Gradebook
                                                </button>
                                            )}

                                            {/* --- MANAGEMENT ACTIONS (HIDDEN IN GRADING MODE) --- */}
                                            {!isGradingMode && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/course-content/${c.id}`)}
                                                        className="btn-primary"
                                                        style={{ backgroundColor: '#40916c', width: 'auto' }}
                                                    >
                                                        📚 Course Content
                                                    </button>

                                                    <button
                                                        onClick={() => navigate(`/attendance/${c.id}`)}
                                                        className="btn-approve"
                                                        style={{ width: 'auto' }}
                                                    >
                                                        📅 Mark Attendance
                                                    </button>

                                                    <button
                                                        onClick={() => navigate(`/attendance-sheet/${c.id}`)}
                                                        className="btn-primary"
                                                        style={{ backgroundColor: '#17a2b8', width: 'auto' }}
                                                    >
                                                        📋 Attendance Sheet
                                                    </button>

                                                    <button
                                                        onClick={() => handleSync(c.id)}
                                                        className="btn-secondary"
                                                        style={{ backgroundColor: '#e9c46a', color: '#333', width: 'auto' }}
                                                    >
                                                        🔄 Sync Batch
                                                    </button>

                                                    <button
                                                        onClick={() => navigate(`/course-details/${c.id}`)}
                                                        className="btn-view-students"
                                                        style={{ backgroundColor: '#52b788', color: 'white', width: 'auto' }}
                                                    >
                                                        👤 View Students
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherCourses;