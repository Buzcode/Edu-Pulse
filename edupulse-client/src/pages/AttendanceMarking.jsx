import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

const AttendanceMarking = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Core Data State
    const [students, setStudents] = useState([]);
    const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Soft Skill Modal State
    const [showRateModal, setShowRateModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [softSkills, setSoftSkills] = useState({ discipline: 4, participation: 4, collaboration: 4 });

    const API_BASE = "https://localhost:7096/api";

    // 1. Fetch Students
    useEffect(() => {
        const fetchStudents = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`${API_BASE}/Courses/${courseId}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(res.data);
                const initialData = {};
                res.data.forEach(s => initialData[s.studentId] = true);
                setAttendanceData(initialData);
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [courseId]);

    // 2. Fetch Existing Attendance
    useEffect(() => {
        const fetchExistingRecords = async () => {
            if (students.length === 0) return;
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`${API_BASE}/Attendance/course/${courseId}/date/${date}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.length > 0) {
                    const existingData = {};
                    res.data.forEach(record => {
                        existingData[record.studentId] = record.isPresent;
                    });
                    setAttendanceData(existingData);
                } else {
                    const resetData = {};
                    students.forEach(s => resetData[s.studentId] = true);
                    setAttendanceData(resetData);
                }
            } catch (err) {
                console.error("Error fetching existing records:", err);
            }
        };
        fetchExistingRecords();
    }, [date, courseId, students]);

    const handleStatusChange = (studentId, isPresent) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: isPresent }));
    };

    // --- SUBMIT ATTENDANCE ---
    const handleSubmit = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');
        const payload = {
            courseId: parseInt(courseId),
            date: date,
            students: Object.keys(attendanceData).map(id => ({
                studentId: parseInt(id),
                isPresent: attendanceData[id]
            }))
        };

        try {
            await axios.post(`${API_BASE}/Attendance/mark`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Attendance and Daily Soft Skills (Defaults) saved!");
            navigate(-1);
        } catch (err) {
            console.error("Error saving attendance:", err);
            alert("Error saving records.");
        } finally {
            setSaving(false);
        }
    };

    // --- OPEN RATING MODAL (Smart Fetch) ---
    const handleOpenRateModal = async (student) => {
        setSelectedStudent(student);
        const token = localStorage.getItem('token');

        // Default values
        setSoftSkills({ discipline: 4, participation: 4, collaboration: 4 });

        try {
            // Check history to see if there is ALREADY a rating for THIS date
            const res = await axios.get(`${API_BASE}/SoftSkills/history/${courseId}/${student.studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Find record matching the selected date picker value
            const existingForDate = res.data.find(r => r.date === date); // API returns YYYY-MM-DD string

            if (existingForDate) {
                setSoftSkills({
                    discipline: existingForDate.discipline,
                    participation: existingForDate.participation,
                    collaboration: existingForDate.collaboration
                });
            }
            // NEW VERSION (Standard fix for unused variables)
        } catch {
            console.log("No existing history found, using defaults.");
        }

        setShowRateModal(true);
    };

    // --- SAVE INDIVIDUAL RATING (Override) ---
    const handleSaveSoftSkills = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_BASE}/SoftSkills/upsert`, {
                studentId: selectedStudent.studentId,
                courseId: parseInt(courseId),
                date: date, // ✅ IMPORTANT: Send the specific date selected
                discipline: softSkills.discipline,
                participation: softSkills.participation,
                collaboration: softSkills.collaboration
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Behavior override saved for ${selectedStudent.name}`);
            setShowRateModal(false);
        } catch (error) {
            console.error("Save skills error:", error);
            alert("Error saving soft skills.");
        }
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    return (
        <div className="dashboard-container">
            <div className="header-strip">
                <button onClick={() => navigate(-1)} className="btn-action">← Back</button>
                <h2>{searchParams.get('date') ? "Edit Attendance" : "Mark Attendance"}</h2>
                <div>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="btn-action"
                        style={{ background: 'white', color: 'black' }}
                    />
                </div>
            </div>

            <div className="user-info-card" style={{ marginTop: '20px' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Status</th>
                            <th>Daily Behavior</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.studentId}>
                                <td>{student.name}</td>
                                <td>
                                    <label style={{ marginRight: '15px', color: attendanceData[student.studentId] ? 'green' : 'black', fontWeight: attendanceData[student.studentId] ? 'bold' : 'normal' }}>
                                        <input
                                            type="radio"
                                            name={`status-${student.studentId}`}
                                            checked={attendanceData[student.studentId] === true}
                                            onChange={() => handleStatusChange(student.studentId, true)}
                                        /> Present
                                    </label>
                                    <label style={{ color: attendanceData[student.studentId] === false ? 'red' : 'black', fontWeight: attendanceData[student.studentId] === false ? 'bold' : 'normal' }}>
                                        <input
                                            type="radio"
                                            name={`status-${student.studentId}`}
                                            checked={attendanceData[student.studentId] === false}
                                            onChange={() => handleStatusChange(student.studentId, false)}
                                        /> Absent
                                    </label>
                                </td>
                                <td>
                                    {/* ✅ NEW: Rate Button directly in Attendance Sheet */}
                                    <button
                                        onClick={() => handleOpenRateModal(student)}
                                        className="btn-action"
                                        style={{
                                            backgroundColor: '#f39c12',
                                            padding: '5px 10px',
                                            fontSize: '0.9rem'
                                        }}
                                        title="Override default behavior score"
                                    >
                                        ⭐ Rate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button
                        onClick={handleSubmit}
                        className="btn-action"
                        disabled={saving}
                        style={{ backgroundColor: '#28a745', padding: '10px 30px' }}
                    >
                        {saving ? "Saving..." : "Submit Attendance"}
                    </button>
                </div>
            </div>

            {/* ✅ MODAL: Daily Evaluation */}
            {showRateModal && selectedStudent && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                    <div className="user-info-card" style={{ width: '400px' }}>
                        <h3>
                            Rate: {selectedStudent.name} <br />
                            <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>
                                for {date}
                            </span>
                        </h3>

                        <div style={{ marginBottom: 15 }}>
                            <label>Discipline (1-5)</label>
                            <input
                                type="range" min="1" max="5"
                                style={{ width: '100%' }}
                                value={softSkills.discipline}
                                onChange={e => setSoftSkills({ ...softSkills, discipline: parseInt(e.target.value) })}
                            />
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{softSkills.discipline}</div>
                        </div>

                        <div style={{ marginBottom: 15 }}>
                            <label>Participation (1-5)</label>
                            <input
                                type="range" min="1" max="5"
                                style={{ width: '100%' }}
                                value={softSkills.participation}
                                onChange={e => setSoftSkills({ ...softSkills, participation: parseInt(e.target.value) })}
                            />
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{softSkills.participation}</div>
                        </div>

                        <div style={{ marginBottom: 15 }}>
                            <label>Collaboration (1-5)</label>
                            <input
                                type="range" min="1" max="5"
                                style={{ width: '100%' }}
                                value={softSkills.collaboration}
                                onChange={e => setSoftSkills({ ...softSkills, collaboration: parseInt(e.target.value) })}
                            />
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{softSkills.collaboration}</div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={handleSaveSoftSkills} className="btn-approve" style={{ flex: 1 }}>Save Override</button>
                            <button onClick={() => setShowRateModal(false)} className="btn-action" style={{ flex: 1, backgroundColor: 'gray' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceMarking;