import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ArchivedCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArchived = async () => {
            try {
                const token = sessionStorage.getItem('ACCESS_TOKEN');
                const res = await axios.get('https://localhost:7096/api/Courses/archived', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(res.data.$values || res.data || []);
            } catch (err) {
                console.error("Error fetching archives", err);
            }
            setLoading(false);
        };
        fetchArchived();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Archives...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Teaching History (Archived)</h2>

            {courses.length > 0 ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {courses.map(course => (
                        <div key={course.id} style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{course.title}</h3>
                                <p style={{ color: '#666', margin: '5px 0' }}>{course.code} • {course.deptName} • Year {course.year} Sem {course.semester}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {/* Teachers can still view materials and grades, but can't sync new students */}
                                <button onClick={() => navigate(`/course-content/${course.id}`)} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #2d6a4f', color: '#2d6a4f', cursor: 'pointer', background: 'white' }}>
                                    View Materials
                                </button>
                                <button onClick={() => navigate(`/course/${course.id}/gradebook`)} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#2d6a4f', color: 'white', cursor: 'pointer' }}>
                                    View Gradebook
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                    No archived courses found.
                </div>
            )}
        </div>
    );
};

export default ArchivedCourses;