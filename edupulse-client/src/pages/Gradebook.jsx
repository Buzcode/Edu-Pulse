import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const Gradebook = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState({ assessments: [], enrollments: [], grades: [], policy: 'Best 2 of 3 Quizzes' });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCol, setNewCol] = useState({ title: '', type: 1, maxMarks: 20 });

    const API_BASE = "https://localhost:7096/api";

    useEffect(() => {
        const fetchAllData = async () => {
            const token = sessionStorage.getItem('ACCESS_TOKEN');
            if (!token) { setLoading(false); return; }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const res = await axios.get(`${API_BASE}/Grades/course/${courseId}`, config);
                const rawStudents = res.data.students || res.data.Students || res.data.$values || [];
                const rawAssessments = res.data.assessments || res.data.Assessments || [];
                const rawGrades = res.data.grades || res.data.Grades || [];
                setData({
                    assessments: rawAssessments,
                    grades: rawGrades,
                    enrollments: (rawStudents.$values || rawStudents).map(s => ({
                        studentId: s.studentId || s.StudentId,
                        name: s.name || s.Name || (s.student ? s.student.name : "Unknown"),
                        student: s
                    })),
                    policy: res.data.policy || 'Best 2 of 3 Quizzes'
                });
                setLoading(false);
            } catch (error) { console.error(error); setLoading(false); }
        };
        fetchAllData();
    }, [courseId, refreshKey]);

    const handleDeleteColumn = async (assessmentId) => {
        if (!window.confirm("Are you sure? This will delete all marks in this column.")) return;
        try {
            await axios.delete(`${API_BASE}/Assessments/${assessmentId}`, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem('ACCESS_TOKEN')}` }
            });
            setRefreshKey(prev => prev + 1);
        } catch (err) { console.error(err); alert("Error deleting column"); }
    };

    const updateMark = async (studentId, assessmentId, mark) => {
        const numericMark = mark === "" ? 0 : parseFloat(mark);
        const updatedGrades = [...data.grades];
        const existingIndex = updatedGrades.findIndex(g => (g.studentId || g.StudentId) === studentId && (g.assessmentId || g.AssessmentId) === assessmentId);
        if (existingIndex > -1) updatedGrades[existingIndex].marksObtained = numericMark;
        else updatedGrades.push({ studentId, assessmentId, marksObtained: numericMark });
        setData(prev => ({ ...prev, grades: updatedGrades }));
        try {
            await axios.post(`${API_BASE}/Grades/bulk-update`, [{ studentId, assessmentId, marksObtained: numericMark }], { headers: { Authorization: `Bearer ${sessionStorage.getItem('ACCESS_TOKEN')}` } });
        } catch (err) { console.error(err); alert("Save failed"); setRefreshKey(prev => prev + 1); }
    };

    const calculateStats = (studentId) => {
        const studentGrades = (data.grades || []).filter(g => (g.studentId || g.StudentId) === studentId);
        const assessments = data.assessments || [];

        // NEW: Improved findGrade to pick the HIGHEST mark if multiple columns exist
        const findBestGrade = (type) => {
            const matches = assessments.filter(a => (a.type === type || a.Type === type));
            if (matches.length === 0) return null;
            const scores = matches.map(a => {
                const g = studentGrades.find(gr => (gr.assessmentId || gr.AssessmentId) === (a.id || a.Id));
                return g ? (g.marksObtained || g.MarksObtained || 0) : 0;
            });
            return Math.max(...scores);
        };

        const carryMark = findBestGrade(6);
        const clearanceMark = findBestGrade(5);
        const finalMark = findBestGrade(3);
        const attdScore = findBestGrade(0) || 0;

        let quizScore = 0;
        const quizAss = assessments.filter(a => (a.type === 1 || a.Type === 1));
        if (quizAss.length > 0) {
            const scores = quizAss.map(a => {
                const g = studentGrades.find(gr => (gr.assessmentId || gr.AssessmentId) === (a.id || a.Id));
                return g ? (g.marksObtained || g.MarksObtained || 0) : 0;
            });
            scores.sort((a, b) => b - a);
            const pickCount = data.policy.includes('Best 3') ? 3 : 2;
            const actualToPick = Math.min(scores.length, pickCount);
            quizScore = scores.slice(0, actualToPick).reduce((a, b) => a + b, 0) / (actualToPick || 1);
        }

        const caTotal = quizScore + attdScore;
        let finalTotal = 0;
        let displayExam = 0;

        if (carryMark !== null && carryMark > 0) {
            finalTotal = (carryMark / 70) * 100;
            displayExam = carryMark;
        } else if (clearanceMark !== null && clearanceMark > 0) {
            finalTotal = caTotal + clearanceMark;
            displayExam = clearanceMark;
        } else {
            finalTotal = caTotal + (finalMark || 0);
            displayExam = finalMark || 0;
        }

        return { attendance: attdScore.toFixed(2), quizzes: quizScore.toFixed(2), final: displayExam.toFixed(2), total: Math.min(finalTotal, 100).toFixed(2) };
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="dashboard-container">
            <div className="header-strip">
                <button onClick={() => navigate(-1)} className="btn-action">← Back</button>
                <h2>Course Gradebook: {courseId}</h2>
                <div style={{ display: 'flex', gap: 10 }}>
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
                                {data.assessments.map(a => (
                                    <th key={a.id || a.Id}>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {a.title || a.Title}
                                            {/* RESTORED: Delete Column Button */}
                                            <button onClick={() => handleDeleteColumn(a.id || a.Id)} style={{ marginLeft: 8, cursor: 'pointer', border: 'none', background: 'none', fontSize: '12px' }}>🗑️</button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.enrollments.map(e => (
                                <tr key={e.studentId}>
                                    <td>{e.name}</td>
                                    {data.assessments.map(a => {
                                        const g = data.grades.find(gr => (gr.assessmentId || gr.AssessmentId) === (a.id || a.Id) && (gr.studentId || gr.StudentId) === e.studentId);
                                        const isAuto = (a.type === 0 || a.Type === 0);
                                        return (
                                            <td key={a.id || a.Id}>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ width: 60, textAlign: 'center', backgroundColor: isAuto ? '#f8f9fa' : 'white', opacity: (a.type === 5 && parseFloat(calculateStats(e.studentId).total) >= 40 && !g) || (a.type === 6 && e.student.status === "Regular") ? 0.3 : 1 }}
                                                    readOnly={isAuto}
                                                    defaultValue={g ? (g.marksObtained || g.MarksObtained) : ''}
                                                    onBlur={ev => {
                                                        if (isAuto) return;
                                                        const val = parseFloat(ev.target.value);
                                                        const max = a.maxMarks || a.MaxMarks || 100;
                                                        if (val > max) { alert(`Max ${max} exceeded`); ev.target.value = g ? (g.marksObtained || g.MarksObtained) : ''; return; }
                                                        if (a.type === 5 && parseFloat(calculateStats(e.studentId).total) >= 40 && !g) { alert("Already passed"); ev.target.value = ''; return; }
                                                        if (a.type === 6 && e.student.status === "Regular") { alert("Regular student cannot have Carry marks"); ev.target.value = ''; return; }
                                                        updateMark(e.studentId, (a.id || a.Id), ev.target.value);
                                                    }}
                                                    disabled={(a.type === 5 && parseFloat(calculateStats(e.studentId).total) >= 40 && !g) || (a.type === 6 && e.student.status === "Regular")}
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
                <h3>Step 2: Promotion Engine Summary</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Student</th>
                            <th>Attendance (10)</th>
                            <th>Quizzes (20)</th>
                            <th>Exam (70)</th>
                            <th>Total Result</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.enrollments.map(e => {
                            const stats = calculateStats(e.studentId);
                            return (
                                <tr key={e.studentId}>
                                    <td style={{ textAlign: 'left' }}>{e.name}</td>
                                    <td>{stats.attendance}</td>
                                    <td>{stats.quizzes}</td>
                                    <td>{stats.final}</td>
                                    <td style={{ fontWeight: 'bold' }}>{stats.total}%</td>
                                    <td style={{ color: parseFloat(stats.total) >= 40 ? 'green' : 'red', fontWeight: 'bold' }}>
                                        {parseFloat(stats.total) >= 40 ? 'PASS' : 'FAIL'}
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
                        <select className="form-input" style={{ width: '100%', marginBottom: 15 }} onChange={e => {
                            const type = parseInt(e.target.value);
                            let max = 20;
                            if (type === 0) max = 10;
                            if (type === 3 || type === 5 || type === 6) max = 70;
                            setNewCol({ ...newCol, type, maxMarks: max });
                        }}>
                            <option value={1}>Quiz (20%)</option>
                            <option value={0}>Attendance (10%)</option>
                            <option value={3}>Final Exam (70%)</option>
                            <option value={5}>Clearance Exam (70%)</option>
                            <option value={6}>Carry Exam (70 marks -&gt; 100%)</option>
                        </select>
                        <label>Max Marks</label>
                        <input type="number" value={newCol.maxMarks} className="form-input" style={{ width: '100%', marginBottom: 15 }} onChange={e => setNewCol({ ...newCol, maxMarks: parseFloat(e.target.value) })} />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={async () => {
                                try {
                                    await axios.post(`${API_BASE}/Assessments`, { ...newCol, date: new Date().toISOString(), weightage: 0, courseId: parseInt(courseId) }, { headers: { Authorization: `Bearer ${sessionStorage.getItem('ACCESS_TOKEN')}` } });
                                    setShowAddModal(false); setRefreshKey(k => k + 1);
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