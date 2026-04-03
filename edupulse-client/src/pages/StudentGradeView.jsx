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

// Register components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale);

const StudentGradeView = () => {
    const { courseId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // State
    const [data, setData] = useState({ courseTitle: '', courseCode: '', policy: '', assessments: [], grades: [], enrollmentId: null });
    const [softSkills, setSoftSkills] = useState(null);
    const [gapAnalysis, setGapAnalysis] = useState([]);
    const [loading, setLoading] = useState(true);

    // API Base URL
    const API_BASE = "https://localhost:7096/api";

    useEffect(() => {
        const fetchAllData = async () => {
            // ✅ FIXED: Look in sessionStorage for ACCESS_TOKEN
            const token = sessionStorage.getItem('ACCESS_TOKEN');
            if (!token) {
                setLoading(false);
                return;
            }

            // Wait until user context is loaded
            if (!user || !user.id) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };

            try {
                const gapRes = await axios.get(`${API_BASE}/Grades/gap-analysis/${courseId}`, config);
                setGapAnalysis(gapRes.data || []);
            } catch (error) {
                console.error("Error fetching gap analysis:", error);
                setGapAnalysis([]);
            }

            try {
                const res = await axios.get(`${API_BASE}/Grades/student/${courseId}`, config);
                setData(res.data);
            } catch (error) {
                console.error("Error fetching grades:", error);
            }

            try {
                const skillRes = await axios.get(`${API_BASE}/SoftSkills/enrollment/${user.id}/${courseId}`, config);
                setSoftSkills(skillRes.data);
            } catch (skillError) {
                console.warn("Soft skills info not found (normal if not rated yet).", skillError);
                setSoftSkills({ discipline: 0, participation: 0, collaboration: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [courseId, user]);

    // --- GAP ANALYSIS CHART DATA ---
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

    // --- RADAR CHART DATA (Soft Skills) ---
    const radarData = {
        labels: ['Discipline', 'Participation', 'Collaboration'],
        datasets: [{
            label: 'Behavioral Rating (1-5)',
            data: [
                softSkills?.discipline || 0,
                softSkills?.participation || 0,
                softSkills?.collaboration || 0
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
        }]
    };

    if (loading) return <div className="dashboard-container">Loading Result Details...</div>;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="header-strip">
                <button onClick={() => navigate(-1)} className="btn-action">← Back</button>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0 }}>Course No: {data.courseCode}</h2>
                    <p style={{ margin: 0, fontWeight: '500', color: '#666' }}>Academic Dashboard</p>
                </div>
            </div>

            {/* ✅ ACADEMIC HEALTH & CORRELATION GRAPH */}
            <div style={{ marginTop: '20px' }}>
                <AcademicPerformanceTab
                    key={`${user?.id}-${courseId}`}
                    studentId={user?.id}
                    courseId={courseId}
                />
            </div>

            {/* GAP ANALYSIS SECTION (The Graph) */}
            <div className="user-info-card" style={{ marginTop: '20px', border: '1px solid #4a90e2' }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '15px' }}>📊 Peer Comparison: My Performance vs. Class Average</h3>
                <div style={{ height: '350px' }}>
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

            {/* LOWER SECTION: Table & Soft Skills */}
            <div className="user-info-card" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '40px' }}>

                {/* Assessment Table */}
                <div>
                    <h4>Assessment Breakdown</h4>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Assessment</th><th style={{ textAlign: 'center' }}>Marks Obtained</th></tr>
                        </thead>
                        <tbody>
                            {data.assessments.map(a => {
                                const g = data.grades.find(gr => gr.assessmentId === a.id);
                                return (
                                    <tr key={a.id}>
                                        <td>{a.title}</td>
                                        <td style={{ textAlign: 'center' }}>{g ? g.marksObtained : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Soft Skills Radar */}
                <div style={{ textAlign: 'center', borderLeft: '1px solid #eee' }}>
                    <h4>Current Behavioral Snapshot</h4>
                    <div style={{ width: '280px', margin: '0 auto' }}>
                        <Radar
                            data={radarData}
                            options={{
                                scales: {
                                    r: {
                                        suggestedMin: 0,
                                        suggestedMax: 5,
                                        ticks: { stepSize: 1, display: false }
                                    }
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