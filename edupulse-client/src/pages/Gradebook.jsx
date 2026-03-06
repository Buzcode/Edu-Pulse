import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const Gradebook = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // 1. Unified State (to match your render logic)
    const [data, setData] = useState({
        assessments: [],
        enrollments: [],
        grades: [],
        policy: 'Best 2 of 3 Quizzes'
    });

    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // 2. UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCol, setNewCol] = useState({ title: '', type: 1, maxMarks: 20 });

   

    const API_BASE = "https://localhost:7096/api";

    // --- MAIN DATA FETCHING ---
    useEffect(() => {
        const fetchAllData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const res = await axios.get(`${API_BASE}/Grades/course/${courseId}`, config);

                const rawStudents = res.data.students || res.data.Students || [];
                const rawAssessments = res.data.assessments || res.data.Assessments || [];
                const rawGrades = res.data.grades || res.data.Grades || [];
                // Fixed: Check if policy exists, otherwise default
                const rawPolicy = res.data.policy || 'Best 2 of 3 Quizzes';

                setData({
                    assessments: rawAssessments,
                    grades: rawGrades,
                    enrollments: rawStudents.map(s => ({
                        studentId: s.studentId || s.StudentId,
                        // handle nested student object safely
                        name: s.name || s.Name || (s.student ? s.student.name : "Unknown"),
                        student: s // keep original ref just in case
                    })),
                    policy: rawPolicy
                });
                setLoading(false);
            } catch (error) {
                console.error("Fetch error:", error);
                setLoading(false);
            }
        };
        fetchAllData();
    }, [courseId, refreshKey]);

    // --- HANDLERS ---

    const handleDeleteColumn = async (assessmentId) => {
        if (!window.confirm("Are you sure you want to delete this column?")) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_BASE}/Assessments/${assessmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRefreshKey(old => old + 1);
        } catch (error) {
            console.error(error);
            alert("Failed to delete column");
        }
    };

    const updateMark = async (studentId, assessmentId, mark) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const numericMark = mark === "" ? 0 : parseFloat(mark); // Fixed variable name usage below

        // Optimistic UI update (optional, prevents flickering)
        const updatedGrades = [...data.grades];
        const existingIndex = updatedGrades.findIndex(g => g.studentId === studentId && g.assessmentId === assessmentId);

        if (existingIndex > -1) {
            updatedGrades[existingIndex].marksObtained = numericMark;
        } else {
            updatedGrades.push({ studentId, assessmentId, marksObtained: numericMark });
        }
        setData(prev => ({ ...prev, grades: updatedGrades }));

        try {
            await axios.post(`${API_BASE}/Grades/bulk-update`,
                [{ studentId, assessmentId, marksObtained: numericMark }], // Fixed: used numericMark instead of numericValue
                config
            );
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save to server.");
            setRefreshKey(old => old + 1);
        }
    };

    // --- CALCULATION LOGIC ---
    const calculateStats = (studentId) => {
        const studentGrades = (data.grades || []).filter(g => (g.studentId || g.StudentId) === studentId);
        const assessments = data.assessments || [];

        // 1. Quizzes
        const quizAssessments = assessments.filter(a => (a.type === 1 || a.Type === 1));
        let quizScore = 0;
        if (quizAssessments.length > 0) {
            const scores = quizAssessments.map(a => {
                const g = studentGrades.find(gr => (gr.assessmentId || gr.AssessmentId) === (a.id || a.Id));
                return g ? (g.marksObtained || g.MarksObtained || 0) : 0;
            });
            scores.sort((a, b) => b - a);
            // Safety check for policy string
            const currentPolicy = data.policy || '';
            const pickCount = currentPolicy.includes('Best 3') ? 3 : 2;
            const actualToPick = Math.min(scores.length, pickCount);

            // Avoid division by zero
            const divisor = actualToPick || 1;
            quizScore = scores.slice(0, actualToPick).reduce((a, b) => a + b, 0) / divisor;
        }

        // 2. Attendance
        const attdAss = assessments.find(a => (a.type === 0 || a.Type === 0));
        let attdScore = 0;
        if (attdAss) {
            const g = studentGrades.find(gr => (gr.assessmentId || gr.AssessmentId) === (attdAss.id || attdAss.Id));
            attdScore = g ? (g.marksObtained || g.MarksObtained || 0) : 0;
        }

        // 3. Final
        const finalAss = assessments.find(a => (a.type === 3 || a.Type === 3));
        let finalScore = 0;
        if (finalAss) {
            const g = studentGrades.find(gr => (gr.assessmentId || gr.AssessmentId) === (finalAss.id || finalAss.Id));
            finalScore = g ? (g.marksObtained || g.MarksObtained || 0) : 0;
        }

        return {
            attendance: attdScore.toFixed(2),
            quizzes: quizScore.toFixed(2),
            final: finalScore.toFixed(2),
            total: Math.min(quizScore + attdScore + finalScore, 100).toFixed(2)
        };
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Gradebook...</div>;

    return (
        <div className="dashboard-container">
            <div className="header-strip">
                <button onClick={() => navigate(-1)} className="btn-action">← Back</button>
                <h2>Course Gradebook: {courseId}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select className="form-input" value={data.policy} onChange={e => setData({ ...data, policy: e.target.value })}>
                        <option>Best 2 of 3 Quizzes</option>
                        <option>Best 3 of 4 Quizzes</option>
                    </select>
                    <button onClick={() => setShowAddModal(true)} className="btn-approve">+ Add Column</button>
                </div>
            </div>

            <div className="user-info-card" style={{ marginTop: 20 }}>
                <h3>Step 1: Mark Entry Spreadsheet</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                {(data.assessments || []).map(a => (
                                    <th key={a.id || a.Id}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {a.title || a.Title}
                                            <button
                                                onClick={() => handleDeleteColumn(a.id || a.Id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 8 }}
                                            >🗑️</button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(data.enrollments || []).map(e => (
                                <tr key={e.studentId}>
                                    <td>{e.name}</td>
                                    {(data.assessments || []).map(a => {
                                        const g = (data.grades || []).find(gr => (gr.assessmentId || gr.AssessmentId) === (a.id || a.Id) && (gr.studentId || gr.StudentId) === e.studentId);
                                        const isAuto = (a.type === 0 || a.Type === 0);
                                        return (
                                            <td key={a.id || a.Id}>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ width: '60px', textAlign: 'center', backgroundColor: isAuto ? '#f8f9fa' : 'white' }}
                                                    readOnly={isAuto}
                                                    defaultValue={g ? (g.marksObtained || g.MarksObtained) : ''}
                                                    onBlur={ev => isAuto ? null : updateMark(e.studentId, (a.id || a.Id), ev.target.value)}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="admin-section" style={{ marginTop: 30 }}>
                <h3>Step 2: Promotion Engine</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Student</th>
                            <th>Attendance (10)</th>
                            <th>Quizzes (20)</th>
                            <th>Final (70)</th>
                            <th>Total Weighted Score</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.enrollments || []).map(e => {
                            const stats = calculateStats(e.studentId);
                            return (
                                <tr key={e.studentId}>
                                    <td style={{ textAlign: 'left', fontWeight: '500' }}>{e.name}</td>
                                    <td>{stats.attendance}</td>
                                    <td>{stats.quizzes}</td>
                                    <td>{stats.final}</td>
                                    <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.total}%</td>
                                    <td>
                                        <span className={parseFloat(stats.total) >= 40 ? 'status-regular' : 'status-irregular'}>
                                            {parseFloat(stats.total) >= 40 ? 'PASS' : 'FAIL'}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="user-info-card" style={{ width: '400px' }}>
                        <h3>Define Assessment</h3>
                        <label>Title</label>
                        <input className="form-input" style={{ width: '100%', marginBottom: 15 }} placeholder="e.g. Quiz 1" onChange={e => setNewCol({ ...newCol, title: e.target.value })} />
                        <label>Category</label>
                        <select className="form-input" style={{ width: '100%', marginBottom: 15 }} onChange={e => setNewCol({ ...newCol, type: parseInt(e.target.value) })}>
                            <option value={1}>Quiz (20%)</option>
                            <option value={0}>Attendance (10%)</option>
                            <option value={3}>Final Exam (70%)</option>
                        </select>
                        <label>Max Marks</label>
                        <input type="number" className="form-input" style={{ width: '100%', marginBottom: 15 }} placeholder="20" onChange={e => setNewCol({ ...newCol, maxMarks: parseFloat(e.target.value) })} />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={async () => {
                                try {
                                    await axios.post(`${API_BASE}/Assessments`, { ...newCol, date: new Date().toISOString(), weightage: 0, courseId: parseInt(courseId) }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                                    setShowAddModal(false);
                                    setRefreshKey(k => k + 1);
                                } catch (err) { console.error(err); alert("Error adding column"); }
                            }} className="btn-approve" style={{ flex: 1 }}>Create Column</button>
                            <button onClick={() => setShowAddModal(false)} className="btn-action" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gradebook;