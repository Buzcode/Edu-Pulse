import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AcademicPerformanceTab = ({ studentId, courseId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = "https://localhost:7096";

    useEffect(() => {
        const cleanStudentId = String(studentId).replace(':', '');
        const cleanCourseId = String(courseId).replace(':', '');

        // GET TOKEN to prevent 401 errors!
        const token = sessionStorage.getItem('ACCESS_TOKEN');

        fetch(`${API_BASE_URL}/api/studentperformance/dashboard/${cleanStudentId}/${cleanCourseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => console.error("Fetch error:", err));
    }, [studentId, courseId]);

    if (loading || !data) return <div className="p-10 text-center text-gray-400">Loading Performance Data...</div>;

    const timeline = data.timeline;

    const chartData = {
        labels: timeline.map(p => p.eventName),
        datasets: [
            {
                label: 'Grades (%)',
                data: timeline.map(p => p.gradePercentage),
                borderColor: '#3b82f6', // Blue
                backgroundColor: 'rgba(59,130,246,0.1)',
                borderWidth: 3,
                tension: 0,
                spanGaps: true,
                pointRadius: ctx => timeline[ctx.dataIndex].gradePercentage != null ? 6 : 0,
                pointBackgroundColor: '#fff',
                yAxisID: 'y'
            },
            {
                label: 'Discipline',
                data: timeline.map(p => p.disciplineRating),
                borderColor: '#ef4444', // Red
                borderDash: [5, 5],
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0, // Removed dots to match Image 2
                yAxisID: 'y1',
                spanGaps: true
            },
            {
                label: 'Participation',
                data: timeline.map(p => p.participationRating),
                borderColor: '#f59e0b', // Yellow/Orange
                borderDash: [5, 5],
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                yAxisID: 'y1',
                spanGaps: true
            },
            {
                label: 'Collaboration',
                data: timeline.map(p => p.collaborationRating),
                borderColor: '#10b981', // Green
                borderDash: [5, 5],
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                yAxisID: 'y1',
                spanGaps: true
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                labels: { boxWidth: 20, padding: 15, usePointStyle: true }
            },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const date = new Date(timeline[context[0].dataIndex].date).toLocaleDateString();
                        return `${timeline[context[0].dataIndex].eventName} (${date})`;
                    }
                }
            }
        },
        scales: {
            y: { min: 0, max: 100, title: { display: true, text: 'Exam Score %', color: '#3b82f6' } },
            y1: { min: 1, max: 5, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Pulse Rating (1-5)', color: '#6b7280' } }
        }
    };

    return (
        <div className="user-info-card" style={{ border: '1px solid #e5e7eb', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>

            {/* --- FIXED HEALTH BAR SECTION --- */}
            <div className="health-bar-wrapper" style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                        Academic Health: <span style={{ color: data.currentPercentage >= 40 ? '#10b981' : '#ef4444' }}>{data.academicHealthStatus}</span>
                    </h3>
                </div>

                <p style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#374151' }}>{data.currentPercentage}%</p>

                {/* Health Bar */}
                <div style={{ position: 'relative', height: '16px', background: '#f3f4f6', borderRadius: '8px', marginTop: '20px' }}>
                    {/* Fill */}
                    <div style={{ width: `${data.currentPercentage}%`, height: '100%', borderRadius: '8px', background: data.currentPercentage >= 40 ? '#10b981' : '#ef4444', transition: 'width 1s ease' }} />

                    {/* Clean PASS MARKER (Matches Image 2 exactly) */}
                    <div style={{ position: 'absolute', left: '40%', top: '-25px', height: '35px', width: '2px', background: '#6b7280', zIndex: 10 }}>
                        <span style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#374151',
                            background: '#fff',
                            padding: '2px 6px',
                            border: '1px solid #9ca3af',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                        }}>
                            PASS (40%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div style={{ height: '380px', marginTop: '30px' }}>
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* Updated Footer Text */}
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #6b7280' }}>
                <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0 }}>
                    <strong>Daily Pulse:</strong> Dashed lines track behavioral traits averaged weekly (Sun–Thu). Solid blue line tracks academic results.
                </p>
            </div>
        </div>
    );
};

export default AcademicPerformanceTab;