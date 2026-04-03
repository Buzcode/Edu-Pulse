import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BatchPromotion = () => {
    // 1. Updated the API Base URL to the correct backend port (7096)
    const API_BASE_URL = 'https://localhost:7096/api';

    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [batchData, setBatchData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${API_BASE_URL}/Departments`)
            .then(res => {
                // Robust check: .NET often wraps arrays in a '$values' property
                const data = res.data.$values || res.data;
                if (Array.isArray(data)) {
                    setDepartments(data);
                } else {
                    console.error("API did not return an array. Check Swagger response format.");
                    setDepartments([]);
                }
            })
            .catch(err => console.error("Error fetching departments", err));
    }, []);

    const handleCheckStatus = async () => {
        if (!selectedDept || !selectedSemester) {
            alert("Please select both Department and Semester");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/Promotion/batch-status?departmentId=${selectedDept}&semester=${selectedSemester}`);

            // Apply the same robust array check here
            const data = response.data.$values || response.data;
            setBatchData(Array.isArray(data) ? data : []);

            if (Array.isArray(data) && data.length === 0) {
                alert("No students found in this batch.");
            }
        } catch (error) {
            console.error("Error fetching batch status", error);
            alert("Failed to fetch data. Ensure your backend is running on https://localhost:7096");
        }
        setLoading(false);
    };

    const handlePublish = async () => {
        const confirmAction = window.confirm(
            "ARE YOU SURE? This will permanently save results and promote eligible students to the next semester."
        );

        if (!confirmAction) return;

        setPublishing(true);
        try {
            await axios.post(`${API_BASE_URL}/Promotion/publish-results?departmentId=${selectedDept}&semester=${selectedSemester}`);
            alert("Success! Batch promotion completed.");
            navigate('/dashboard');
        } catch (error) {
            console.error("Error publishing results", error);
            alert("Failed to publish results. Please check server logs.");
        }
        setPublishing(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
            <h2 style={{ color: '#2c3e50' }}>Batch Promotion Engine</h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div>
                    <label style={{ fontWeight: 'bold' }}>Department: </label>
                    <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ padding: '5px' }}>
                        <option value="">-- Select --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontWeight: 'bold' }}>Semester: </label>
                    <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ padding: '5px' }}>
                        <option value="">-- Select --</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleCheckStatus}
                    disabled={loading}
                    style={{ cursor: 'pointer', padding: '5px 15px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                    {loading ? "Checking..." : "Check Batch Status"}
                </button>
            </div>

            {batchData.length > 0 && (
                <>
                    <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px', borderRadius: '5px', overflow: 'hidden' }}>
                        <thead style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                            <tr>
                                <th>Student Name</th>
                                <th>Current Fails</th>
                                <th>Total Carry Count</th>
                                <th>Status</th>
                                <th>Logic Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batchData.map((student, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td>{student.studentName}</td>
                                    <td>{student.currentFails}</td>
                                    <td>{student.totalActiveCarry}</td>
                                    <td style={{ color: student.eligibleForPromotion ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                                        {student.eligibleForPromotion ? "Eligible" : "Drop"}
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: student.action === "Promote" ? '#e6fffa' : '#fff5f5',
                                            color: student.action === "Promote" ? '#2c7a7b' : '#c53030',
                                            fontWeight: 'bold'
                                        }}>
                                            {student.action}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ textAlign: 'right' }}>
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            style={{
                                backgroundColor: '#27ae60',
                                color: 'white',
                                padding: '12px 25px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            {publishing ? "Processing Promotion..." : "Publish & Execute Promotion"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default BatchPromotion;