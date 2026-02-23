import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Gradebook = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState({
        assessments: [],
        enrollments: [],
        grades: [],
        policy: 'Best 2 of 3 Quizzes'
    });

    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);

    // Default maxMarks to 20 for Quizzes
    const [newCol, setNewCol] = useState({ title: '', type: 1, maxMarks: 20 });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const res = await API.get(`/Grades/course/${courseId}`);
                const rawStudents = res.data.students || res.data.Students || [];
                const rawAssessments = res.data.assessments || res.data.Assessments || [];
                const rawGrades = res.data.grades || res.data.Grades || [];
                const rawPolicy = res.data.policy || 'Best 2 of 3 Quizzes';

                setData({
                    assessments: rawAssessments,
                    grades: rawGrades,
                    enrollments: rawStudents.map(s => ({
                        studentId: s.studentId || s.StudentId,
                        name: s.name || s.Name || (s.student ? s.student.name : "Unknown")
                    })),
                    policy: rawPolicy
                });
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [courseId, refreshKey]);

    const handleDeleteColumn = async (assessmentId) => {
        if (!window.confirm("Are you sure you want to delete this column and all its grades?")) return;
        try {
            await API.delete(`/Assessments/${assessmentId}`);
            setRefreshKey(old => old + 1);
        } catch (error) {
            alert("Failed to delete column");
        }
    };

    const updateMark = async (studentId, assessmentId, mark, maxPossible) => {
        const numericMark = mark === "" ? 0 : parseFloat(mark);

        // Safety check: Don't allow marks higher than column max
        if (numericMark > maxPossible) {
            alert(`Marks cannot exceed the maximum of ${maxPossible}`);
            setRefreshKey(old => old + 1);
            return;
        }

        try {
            await API.post(`/Grades/bulk-update`, [{ studentId, assessmentId, marksObtained: numericMark }]);
        } catch (err) {
            alert("Failed to save to server.");
            setRefreshKey(old => old + 1);
        }
    };

    const calculateStats = (studentId) => {
        const studentGrades = (data.grades || []).filter(g => (g.studentId || g.StudentId) === studentId);
        const assessments = data.assessments || [];

        const quizAssessments = assessments.filter(a => (a.type === 1 || a.Type === 1));
        let quizScore = 0;
        if (quizAssessments.length > 0) {
            const scores = quizAssessments.map(a => {
                const g = studentGrades.find(gr => (gr.assessmentId || gr.AssessmentId) === (a.id || a.Id));
                return g ? (g.marksObtained || g.MarksObtained || 0) : 0;
            }).sort((a, b) => b - a);
            const pickCount = data.policy.includes('Best 3') ? 3 : 2;
            const actualToPick = Math.min(scores.length, pickCount);
            quizScore = scores.slice(0, actualToPick).reduce((a, b) => a + b, 0) / (actualToPick || 1);
        }

        const getScore = (type) => {
            const ass = assessments.find(a => (a.type === type || a.Type === type));
            if (!ass) return 0;
            const g = studentGrades.find(gr => (gr.assessmentId || gr.AssessmentId) === (ass.id || ass.Id));
            return g ? (g.marksObtained || g.MarksObtained || 0) : 0;
        };

        const attd = getScore(0);
        const final = getScore(3);

        return {
            attendance: attd.toFixed(2),
            quizzes: quizScore.toFixed(2),
            final: final.toFixed(2),
            total: Math.min(quizScore + attd + final, 100).toFixed(2)
        };
    };

    if (loading) return <div className="dashboard-container">Loading Gradebook...</div>;

    return (
        <div className="dashboard-container">
            <div className="header-strip">
                <button onClick={() => navigate(-1)} className="btn-action">← Back</button>
                <h2>Course Gradebook</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select className="form-input" value={data.policy} onChange={e => setData({ ...data, policy: e.target.value })}>
                        <option>Best 2 of 3 Quizzes</option>
                        <option>Best 3 of 4 Quizzes</option>
                    </select>
                    <button onClick={() => setShowAddModal(true)} className="btn-approve">+ Add Column</button>
                </div>
            </div>

            <div className="user-info-card" style={{ marginTop: '20px' }}>
                <h3>Mark Entry Spreadsheet</h3>
                <div className="gradebook-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Student Name</th>
                                {data.assessments.map(a => (
                                    <th key={a.id || a.Id} style={{ textAlign: 'center' }}>
                                        {a.title || a.Title} ({a.maxMarks || a.MaxMarks})
                                        <button className="btn-delete-col" onClick={() => handleDeleteColumn(a.id || a.Id)}>🗑️</button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.enrollments.map(e => (
                                <tr key={e.studentId}>
                                    <td style={{ fontWeight: '500' }}>{e.name}</td>
                                    {data.assessments.map(a => {
                                        const g = data.grades.find(gr => (gr.assessmentId || gr.AssessmentId) === (a.id || a.Id) && (gr.studentId || gr.StudentId) === e.studentId);

                                        // ✅ STEP 1: Identify Attendance type (0)
                                        const isAuto = (a.type === 0 || a.Type === 0);

                                        return (
                                            <td key={a.id || a.Id} style={{ textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    className="mark-input"
                                                    // ✅ STEP 2: Make ReadOnly and change color for Attendance
                                                    readOnly={isAuto}
                                                    style={{ backgroundColor: isAuto ? '#f0f2f5' : 'white', cursor: isAuto ? 'not-allowed' : 'text' }}
                                                    defaultValue={g?.marksObtained || ''}
                                                    // ✅ STEP 3: Prevent update call if isAuto
                                                    onBlur={ev => isAuto ? null : updateMark(e.studentId, (a.id || a.Id), ev.target.value, a.maxMarks || a.MaxMarks)}
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

            {/* Promotion Engine Section - Keep same as current */}
            <div className="admin-section" style={{ marginTop: '30px' }}>
                <h3>Promotion Engine</h3>
                <div className="gradebook-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Student</th>
                                <th style={{ textAlign: 'center' }}>Attendance (10)</th>
                                <th style={{ textAlign: 'center' }}>Quizzes (20)</th>
                                <th style={{ textAlign: 'center' }}>Final (70)</th>
                                <th style={{ textAlign: 'center' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.enrollments.map(e => {
                                const stats = calculateStats(e.studentId);
                                return (
                                    <tr key={e.studentId}>
                                        <td style={{ fontWeight: '500' }}>{e.name}</td>
                                        <td style={{ textAlign: 'center' }}>{stats.attendance}</td>
                                        <td style={{ textAlign: 'center' }}>{stats.quizzes}</td>
                                        <td style={{ textAlign: 'center' }}>{stats.final}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#059669' }}>{stats.total}%</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Force 10 marks for Attendance */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>Add Assessment Column</h3></div>
                        <div className="modal-form-group">
                            <label className="modal-label">Column Title</label>
                            <input className="form-input" style={{ width: '100%' }} placeholder="e.g. Quiz 1" onChange={e => setNewCol({ ...newCol, title: e.target.value })} />
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Assessment Type</label>
                            <select
                                className="form-input"
                                style={{ width: '100%' }}
                                onChange={e => {
                                    const type = parseInt(e.target.value);
                                    // ✅ Force 10 marks if type is Attendance (0)
                                    setNewCol({ ...newCol, type, maxMarks: type === 0 ? 10 : 20 });
                                }}
                            >
                                <option value={1}>Quiz (20%)</option>
                                <option value={0}>Attendance (10%)</option>
                                <option value={3}>Final Exam (70%)</option>
                            </select>
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Max Marks</label>
                            <input
                                type="number"
                                className="form-input"
                                style={{ width: '100%' }}
                                value={newCol.maxMarks}
                                // Disable manual entry for max marks if it's Attendance
                                disabled={newCol.type === 0}
                                onChange={e => setNewCol({ ...newCol, maxMarks: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={async () => {
                                if (!newCol.title) return alert("Title is required");
                                try {
                                    await API.post('/Assessments', { ...newCol, courseId: parseInt(courseId), date: new Date().toISOString() });
                                    setShowAddModal(false);
                                    setRefreshKey(k => k + 1);
                                } catch (err) { alert("Error adding column"); }
                            }} className="btn-approve">Create</button>
                            <button onClick={() => setShowAddModal(false)} className="btn-action">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gradebook;