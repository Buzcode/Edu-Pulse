import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const EnrolledCourses = () => {
    const { user } = useContext(AuthContext);
    const [myCourses, setMyCourses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        API.get('/Courses').then(res => setMyCourses(res.data));
    }, [user]);

    return (
        <div className="courses-section">
            <h2 className="page-title">My Enrolled Courses</h2>
            <div className="courses-grid">
                {myCourses.map(course => (
                    <div key={course.id} className="course-card" onClick={() => navigate(`/course-content/${course.id}`)}>
                        <h4 className="course-code">{course.code}</h4>
                        <h3 style={{ margin: '5px 0' }}>{course.title}</h3>
                        <p className="course-subtext">Instructor: {course.teacherName}</p>

                        {/* Use your existing Result logic here */}
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/student/result/${course.id}`); }}
                            className="btn-primary"
                            style={{ marginTop: '15px', width: '100%', backgroundColor: '#2ecc71' }}
                        >
                            📈 View Performance Result
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default EnrolledCourses;