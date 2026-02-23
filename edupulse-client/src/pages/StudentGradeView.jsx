import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const StudentGradeView = () => {
    const { courseId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [data, setData] = useState({
        courseTitle: '',
        courseCode: '',
        assessments: [],
        grades: []
    });
    const [loading, setLoading] = useState(true);

    const API_BASE = "https://localhost:7096/api";

    useEffect(() => {
        const fetchGrades = async () => {
            const token = localStorage.getItem('token');
            if (!token || !user?.id) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };
            const cleanCourseId = String(courseId).replace(':', '');

            try {
                // Fetch Basic Grades (Assessment Breakdown)
                const res = await axios.get(`${API_BASE}/Grades/student/${cleanCourseId}`, config);
                setData(res.data);
            } catch (error) {
                console.error("Error fetching student grades:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [courseId, user]);

    if (loading) return <div className="dashboard-container">Loading Academic Profile...</div>;

    return (
        <div className="dashboard-container">
            {/* 1. Header Section */}
            <div className="header-strip">
                <button onClick={() => navigate(-1)} className="btn-action">← Back</button>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0 }}>Course: {data.courseCode}</h2>
                    <p style={{ margin: 0, fontWeight: '500', color: '#666' }}>Academic Performance Dashboard</p>
                </div>
            </div>

            {/* 2. Assessment Breakdown Table */}
            <div className="user-info-card" style={{ marginTop: '20px', marginBottom: '40px' }}>
                <h4 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Assessment Breakdown</h4>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Assessment Name</th>
                            <th style={{ textAlign: 'center' }}>Marks Obtained</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.assessments.map(a => {
                            const g = data.grades.find(gr => gr.assessmentId === a.id);
                            return (
                                <tr key={a.id}>
                                    <td>{a.title}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                        {g ? g.marksObtained : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentGradeView;