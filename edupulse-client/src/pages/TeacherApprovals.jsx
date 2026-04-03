import { useState, useEffect } from 'react';
import API from '../api/axios';

const TeacherApprovals = () => {
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Function to refresh the list
    const fetchTeachers = async () => {
        try {
            const res = await API.get('/Auth/pending-teachers');
            setPendingTeachers(res.data);
        } catch (err) {
            console.error("Error fetching teachers", err);
        } finally {
            setLoading(false);
        }
    };

    // Load data only once when component mounts
    useEffect(() => {
        fetchTeachers();
    }, []); // Empty array ensures this only runs once

    const approveTeacher = async (id) => {
        try {
            await API.post(`/Auth/approve-teacher/${id}`);
            alert('Teacher Approved Successfully!');
            // Refresh list after approval
            fetchTeachers();
        } catch {
            alert('Approval failed.');
        }
    };

    return (
        <div className="admin-container">
            <h2 className="page-title" style={{ color: '#1b4332', marginBottom: '20px' }}>
                Pending Teacher Approvals
            </h2>

            <div className="admin-section">
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    Review and approve new teacher registrations to grant them access to the portal.
                </p>

                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading registrations...</div>
                ) : pendingTeachers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ccc' }}>
                        <p style={{ color: '#888', fontStyle: 'italic' }}>No pending teacher registrations at this time.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Official Email</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingTeachers.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: '500' }}>{t.name}</td>
                                    <td>{t.email}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => approveTeacher(t.id)}
                                            className="btn-approve"
                                            style={{ padding: '8px 20px', cursor: 'pointer' }}
                                        >
                                            Approve Access
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <footer className="iums-footer-text" style={{ marginTop: '50px', textAlign: 'center', color: '#999', fontSize: '0.8rem' }}>
                2026 © EduPulse Management System - Administrative Portal
            </footer>
        </div>
    );
};

export default TeacherApprovals;