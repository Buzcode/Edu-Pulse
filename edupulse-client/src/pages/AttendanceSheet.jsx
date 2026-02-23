import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const AttendanceSheet = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = "https://localhost:7096/api";

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                // 1. Get the list of enrolled students (for the rows)
                const studentsRes = await axios.get(`${API_BASE}/Courses/${courseId}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // 2. Get the full attendance history (for the cells)
                const historyRes = await axios.get(`${API_BASE}/Attendance/history/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setStudents(studentsRes.data);
                setHistory(historyRes.data);
            } catch (error) {
                console.error("Error loading sheet data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    // ✅ FIXED: Handle Delete Day function with clean syntax
    const handleDeleteDay = async (date) => {
        const dateFormatted = new Date(date).toLocaleDateString();
        if (!window.confirm(`Are you sure you want to delete ALL attendance records for ${dateFormatted}?`)) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_BASE}/Attendance/course/${courseId}/date/${date}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh the page to show the updated grid
            window.location.reload();
        } catch (err) {
            console.error("Error deleting records:", err);
            alert("Error deleting records. Please check the console.");
        }
    };

    if (loading) return <div className="dashboard-container">Loading Attendance Register...</div>;

    // --- GRID LOGIC ---

    // 1. Identify all unique dates in the history and sort them
    const uniqueDates = [...new Set(history.map(r => r.date.split('T')[0]))].sort();

    // 2. Helper to find status (✅ / ❌ / -)
    const getStatus = (studentId, dateStr) => {
        const record = history.find(r =>
            r.studentId === studentId &&
            r.date.startsWith(dateStr)
        );
        if (!record) return '-';
        return record.isPresent ? '✅' : '❌';
    };

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate(-1)} className="btn-action" style={{ minWidth: '90px' }}>
                        ← Back
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Attendance Register</h2>
                </div>

                <button
                    onClick={() => navigate(`/attendance/${courseId}`)}
                    className="btn-primary"
                    style={{
                        fontSize: '0.9rem',
                        width: 'auto',
                        padding: '10px 20px',
                        backgroundColor: '#28a745'
                    }}
                >
                    + Mark New Date
                </button>
            </div>

            {/* Table Section */}
            <div className="user-info-card" style={{ marginTop: '20px', overflowX: 'auto', padding: '0' }}>
                {uniqueDates.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No attendance records found yet. Click "+ Mark New Date" to begin.
                    </p>
                ) : (
                    <table className="admin-table" style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{
                                    position: 'sticky',
                                    left: 0,
                                    background: '#f8f9fa',
                                    zIndex: 10,
                                    borderRight: '2px solid #ddd',
                                    padding: '15px'
                                }}>
                                    Student Name
                                </th>

                                {uniqueDates.map(date => (
                                    <th key={date} style={{ minWidth: '120px', textAlign: 'center', padding: '10px' }}>
                                        <div>{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>

                                        {/* Edit & Delete Action Icons */}
                                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button
                                                title="Edit this day"
                                                onClick={() => navigate(`/attendance/${courseId}?date=${date}`)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                title="Delete this day"
                                                onClick={() => handleDeleteDay(date)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </th>
                                ))}

                                <th style={{ borderLeft: '2px solid #ddd', textAlign: 'center', padding: '15px' }}>
                                    Total %
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                // Calculate summary stats for each student row
                                const studentRecords = history.filter(h => h.studentId === student.studentId);
                                const presentCount = studentRecords.filter(h => h.isPresent).length;
                                const totalCount = uniqueDates.length;
                                const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

                                return (
                                    <tr key={student.studentId} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{
                                            position: 'sticky',
                                            left: 0,
                                            background: 'white',
                                            fontWeight: 'bold',
                                            borderRight: '2px solid #ddd',
                                            padding: '12px 15px'
                                        }}>
                                            {student.name}
                                        </td>

                                        {uniqueDates.map(date => {
                                            const status = getStatus(student.studentId, date);
                                            return (
                                                <td key={date} style={{ textAlign: 'center', fontSize: '1.2rem', padding: '12px' }}>
                                                    {status === '✅' && <span style={{ color: '#28a745' }}>●</span>}
                                                    {status === '❌' && <span style={{ color: '#dc3545' }}>X</span>}
                                                    {status === '-' && <span style={{ color: '#ccc' }}>-</span>}
                                                </td>
                                            );
                                        })}

                                        <td style={{
                                            borderLeft: '2px solid #ddd',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            color: percentage >= 75 ? '#28a745' : '#dc3545',
                                            padding: '12px'
                                        }}>
                                            {percentage}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AttendanceSheet;