import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

const AttendanceProgress = ({ courseId }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const decoded = jwtDecode(token);
                const studentId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

                const res = await axios.get(`https://localhost:7096/api/Attendance/summary/${courseId}/${studentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSummary(res.data);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) fetchAttendance();
    }, [courseId]);

    if (loading) return <div className="attendance-loading">Loading attendance records...</div>;
    if (!summary || summary.totalClasses === 0) return null;

    // Logic to determine CSS class based on percentage
    const getStatusClass = (pct) => {
        if (pct >= 80) return 'status-good';
        if (pct >= 60) return 'status-warning';
        return 'status-danger';
    };

    return (
        <div className="attendance-combined-card">
            <div className="attendance-info-row">
                <span className="attendance-label">Attendance Presence</span>
                <span className="attendance-count">
                    {summary.attendedClasses} / {summary.totalClasses} Classes
                </span>
            </div>

            <div className="attendance-progress-bg">
                <div
                    className={`attendance-progress-fill ${getStatusClass(summary.percentage)}`}
                    style={{ width: `${summary.percentage}%` }}
                ></div>
            </div>

            <div className="attendance-score-row">
                <div className="score-detail">
                    <span className="percentage-text">{summary.percentage}% Presence</span>
                    <small className="scale-hint">Scale: {summary.percentage}% → {summary.gradePoints}/10</small>
                </div>
                <div className="score-mark-box">
                    <span className="mark-label">Gradebook Contribution</span>
                    <span className="mark-value">{summary.gradePoints} / 10 Marks</span>
                </div>
            </div>
        </div>
    );
};

export default AttendanceProgress;