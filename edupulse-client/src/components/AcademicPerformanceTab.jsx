import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AcademicPerformanceTab = ({ studentId, courseId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE_URL = "https://localhost:7096";

    useEffect(() => {
        if (!studentId || !courseId) return;

        const controller = new AbortController();
        const cleanStudentId = String(studentId).replace(':', '');
        const cleanCourseId = String(courseId).replace(':', '');

        const fetchData = async () => {
            setLoading(prev => (prev ? prev : true));
            setError(null);

            try {
                // ✅ CORRECTED ORDER: Student ID first (2), then Course ID (5)
                const response = await fetch(
                    `${API_BASE_URL}/api/studentperformance/dashboard/${cleanStudentId}/${cleanCourseId}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `Server responded with ${response.status}`);
                }

                const json = await response.json();
                if (!controller.signal.aborted) {
                    setData(json);
                    setLoading(false);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Fetch error:", err);
                    if (!controller.signal.aborted) {
                        setError(err.message);
                        setLoading(false);
                    }
                }
            }
        };

        fetchData();

        return () => controller.abort();

    }, [studentId, courseId]);

    if (loading) return <div className="p-10 text-center text-gray-400">Loading Performance Data...</div>;

    if (error) return (
        <div className="p-10 text-center text-red-400">
            <p>Unable to load chart data.</p>
            <small>{error}</small>
        </div>
    );

    if (!data) return <div className="p-10 text-center text-gray-400">No data available.</div>;

    const timeline = data.timeline || [];

    const chartData = {
        labels: timeline.map(p => p.eventName),
        datasets: [
            {
                label: 'Grades (%)',
                data: timeline.map(p => p.gradePercentage),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.1)',
                borderWidth: 4,
                tension: 0,
                spanGaps: true,
                pointRadius: ctx => timeline[ctx.dataIndex].gradePercentage != null ? 6 : 0,
                pointBackgroundColor: '#fff',
                yAxisID: 'y'
            },
            {
                label: 'Discipline',
                data: timeline.map(p => p.disciplineRating ?? p.DisciplineRating),
                borderColor: '#ef4444',
                borderDash: [5, 5],
                tension: 0.3,
                pointRadius: 0,
                spanGaps: true,
                yAxisID: 'y1'
            },
            {
                label: 'Participation',
                data: timeline.map(p => p.participationRating ?? p.ParticipationRating),
                borderColor: '#f59e0b',
                borderDash: [2, 2],
                tension: 0.3,
                pointRadius: 0,
                spanGaps: true,
                yAxisID: 'y1'
            },
            {
                label: 'Collaboration',
                data: timeline.map(p => p.collaborationRating ?? p.CollaborationRating),
                borderColor: '#10b981',
                borderDash: [10, 5],
                tension: 0.3,
                pointRadius: 0,
                spanGaps: true,
                yAxisID: 'y1'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', labels: { boxWidth: 15, padding: 15, font: { size: 11 } } },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const item = timeline[context[0].dataIndex];
                        const dateStr = new Date(item.date).toLocaleDateString();
                        return item.eventName.includes("Review")
                            ? `${item.eventName} (Week Ending Thu, ${dateStr})`
                            : `${item.eventName} (${dateStr})`;
                    }
                }
            }
        },
        scales: {
            y: {
                min: 0, max: 100,
                title: { display: true, text: 'Exam Score %', color: '#3b82f6' }
            },
            y1: {
                min: 1, max: 5,
                position: 'right',
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'Pulse Rating (1-5)', color: '#666' }
            }
        }
    };

    return (
        <div className="user-info-card" style={{ border: '1px solid #e5e7eb', padding: '24px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <div className="health-bar-wrapper" style={{ marginBottom: '60px' }}>
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        Academic Health: <span style={{ color: data.currentPercentage >= 40 ? '#10b981' : '#ef4444' }}>{data.academicHealthStatus}</span>
                    </h3>
                    <p className="text-3xl font-black text-gray-900">{data.currentPercentage}%</p>
                </div>
                <div style={{ position: 'relative', height: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
                    <div style={{ width: `${data.currentPercentage}%`, height: '100%', borderRadius: '8px', background: data.currentPercentage >= 40 ? '#10b981' : '#ef4444', transition: 'width 1s ease' }} />
                    <div style={{ position: 'absolute', left: '40%', top: '-8px', height: '32px', width: '2px', background: '#374151', zIndex: 10 }}>
                        <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: '900', color: '#374151', whiteSpace: 'nowrap', background: '#fff', padding: '0 4px', border: '1px solid #374151', borderRadius: '3px' }}>PASS (40%)</span>
                    </div>
                </div>
            </div>

            <div style={{ height: '400px', marginTop: '20px' }}>
                <Line data={chartData} options={chartOptions} />
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-800 italic m-0">
                    <strong>Daily Pulse:</strong> Dashed lines track behavioral traits averaged weekly (Sun–Thu). Solid blue line tracks academic results.
                </p>
            </div>
        </div>
    );
};

export default AcademicPerformanceTab;