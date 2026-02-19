import { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
            alert("Course Created!");
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
            <div className="header-strip teacher-courses-header">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-action"
                >
                    ← Back to Dashboard
                </button>
                <h2>Manage Your Courses</h2>
            </div>

            {/* Create Course Form */}
            <form
                onSubmit={handleCreate}
                className="user-info-card teacher-course-form"
            >
                <h3>Create New Course</h3>

                <input
                    placeholder="Course Title"
                    value={newCourse.title}
                    onChange={e =>
                        setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    required
                    className="form-input"
                />

                <input
                    placeholder="Course Code"
                    value={newCourse.code}
                    onChange={e =>
                        setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    required
                    className="form-input"
                />

                <select
                    value={newCourse.targetDeptId}
                    onChange={e =>
                        setNewCourse({
                            ...newCourse,
                            targetDeptId: e.target.value
                        })
                    }
                    required
                    className="form-input"
                >
                    <option value="">Select Target Department</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.name}
                        </option>
                    ))}
                </select>

                <div className="teacher-course-year-sem">
                    <input
                        type="number"
                        placeholder="Year"
                        value={newCourse.year}
                        onChange={e =>
                            setNewCourse({ ...newCourse, year: e.target.value })
                        }
                        required
                        className="form-input"
                    />
                    <input
                        type="number"
                        placeholder="Semester"
                        value={newCourse.semester}
                        onChange={e =>
                            setNewCourse({
                                ...newCourse,
                                semester: e.target.value
                            })
                        }
                        required
                        className="form-input"
                    />
                </div>

                <button type="submit" className="btn-approve">
                    Create Course
                </button>
            </form>

            {/* Active Courses Table */}
            <div className="admin-section">
                <h3>Your Active Courses</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Title</th>
                            <th>Target Audience</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map(c => (
                            <tr key={c.id}>
                                <td>{c.code}</td>
                                <td>{c.title}</td>
                                <td>
                                    {c.deptName} (Y{c.year} S{c.semester})
                                </td>
                                <td>
                                    {/* ✅ ADDED: Mark Attendance Button */}
                                    <button
                                        onClick={() => navigate(`/attendance/${c.id}`)}
                                        className="btn-action"
                                        style={{ marginRight: '5px', backgroundColor: '#6f42c1', color: 'white' }}
                                    >
                                        Mark Attendance
                                    </button>

                                    <button
                                        onClick={() => handleSync(c.id)}
                                        className="btn-approve"
                                        style={{ marginRight: '5px' }}
                                    >
                                        Sync Batch
                                    </button>

                                    <button
                                        onClick={() => navigate(`/course-details/${c.id}`)}
                                        className="btn-action btn-view-students"
                                    >
                                        View Students
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherCourses;