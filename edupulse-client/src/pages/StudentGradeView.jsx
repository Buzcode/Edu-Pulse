import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AcademicPerformanceTab from '../components/AcademicPerformanceTab';

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale
);

const StudentGradeView = () => {
    const { courseId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- State ---
    const [data, setData] = useState({
        courseTitle: '',
        courseCode: '',
        policy: '',
        assessments: [],
        grades: [],
        enrollmentId: null
    });
    const [softSkills, setSoftSkills] = useState(null);
    const [gapAnalysis, setGapAnalysis] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = "https://localhost:7096/api";

    useEffect(() => {
        const fetchAllData = async () => {
            const token = localStorage.getItem('token');
            if (!token || !user?.id) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Clean IDs to ensure no extra colons/characters
            const cleanCourseId = String(courseId).replace(':', '');
            const cleanStudentId = String(user.id).replace(':', '');

            try {
                // 1. Fetch Gap Analysis (Peer Comparison Line Graph)
                const gapRes = await axios.get(`${API_BASE}/Grades/gap-analysis/${cleanCourseId}`, config);
                setGapAnalysis(gapRes.data || []);

                // 2. Fetch Grades (Table Data)
                const res = await axios.get(`${API_BASE}/Grades/student/${cleanCourseId}`, config);
                setData(res.data);

                // 3. Fetch Latest Soft Skills (Radar Chart Snapshot)
                // ✅ CORRECTED ORDER: Student ID first (2), then Course ID (5)
                const skillRes = await axios.get(`${API_BASE}/SoftSkills/enrollment/${cleanStudentId}/${cleanCourseId}`, config);
                setSoftSkills(skillRes.data);

            } catch (error) {
                console.error("Error fetching student dashboard data:", error);
                // Just set defaults directly if the fetch fails
                setSoftSkills({ discipline: 0, participation: 0, collaboration: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [courseId, user]);

    // --- GAP ANALYSIS CHART DATA (Peer Comparison) ---
    const gapChartData = {
        labels: gapAnalysis?.map(a => a.assessmentTitle) || [],
        datasets: [
            {
                label: 'My Score (%)',
                data: gapAnalysis?.map(a => a.myPercentage) || [],
                borderColor: '#4a90e2',
                backgroundColor: '#4a90e2',
                tension: 0,
                borderWidth: 4,
                pointRadius: 6,
            },
            {
                label: 'Class Average (%)',
                data: gapAnalysis?.map(a => a.classAveragePercentage) || [],
                borderColor: '#e74c3c',
                backgroundColor: '#e74c3c',
                borderDash: [5, 5],
                tension: 0,
                borderWidth: 4,
                pointRadius: 6,
            }
        ]
    };

    // --- RADAR CHART DATA (Latest Behavioral Snapshot) ---
    const radarData = {
        labels: ['Discipline', 'Participation', 'Collaboration'],
        datasets: [{
            label: 'Current Rating',
            data: [
                softSkills?.discipline || 0,
                softSkills?.participation || 0,
                softSkills?.collaboration || 0
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        }]
    };

    if (loading) return <div className="dashboard-container">Loading Academic Profile...</div>;

    return (
        <div className="dashboard-container">
            {/* 1. Header Section */}
            <div className="header-strip">
                <button onClick={() => navigate(-1)} className="btn-action">← Back</button>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0 }}>Course No: {data.courseCode}</h2>
                    <p style={{ margin: 0, fontWeight: '500', color: '#666' }}>Academic Performance Dashboard</p>
                </div>
            </div>

            {/* 2. ACADEMIC HEALTH & TREND (The Healthbar + Orange Pulse) */}
            <div style={{ marginTop: '20px' }}>
                <AcademicPerformanceTab
                    key={`${user?.id}-${courseId}`}
                    studentId={user?.id}
                    courseId={courseId}
                />
            </div>

            {/* 3. PEER COMPARISON SECTION (Gap Analysis Graph) */}
            <div className="user-info-card" style={{ marginTop: '20px', border: '1px solid #4a90e2' }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '15px' }}>📊 Peer Comparison: My Performance vs. Class Average</h3>
                <div style={{ height: '300px' }}>
                    <Line
                        data={gapChartData}
                        options={{
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    min: 0,
                                    max: 110,
                                    ticks: {
                                        stepSize: 20,
                                        callback: (value) => value <= 100 ? value + '%' : ''
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* 4. LOWER SECTION: Table & Behavioral Radar */}
            <div className="user-info-card" style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '30px',
                marginBottom: '40px'
            }}>

                {/* Left: Assessment Table */}
                <div>
                    <h4 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Assessment Breakdown</h4>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Assessment</th>
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

                {/* Right: Soft Skills Radar (Latest Snapshot) */}
                <div style={{ textAlign: 'center', borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Behavioral Profile Snapshot</h4>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '20px' }}>
                        instructors rate these daily during attendance.
                    </p>
                    <div style={{ width: '280px', margin: '0 auto' }}>
                        <Radar
                            data={radarData}
                            options={{
                                scales: {
                                    r: {
                                        suggestedMin: 0,
                                        suggestedMax: 5,
                                        ticks: { stepSize: 1, display: false },
                                        pointLabels: { font: { size: 12, weight: '600' } }
                                    }
                                },
                                plugins: {
                                    legend: { display: false }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentGradeView;