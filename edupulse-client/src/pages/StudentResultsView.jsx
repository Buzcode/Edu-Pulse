import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentResultsView = () => {
    const [allData, setAllData] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = "https://localhost:7096/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('ACCESS_TOKEN');
                const res = await axios.get(`${API_BASE}/Results/my-results`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = res.data.$values || res.data;
                setAllData(data);
                if (data.length > 0) setSelectedSemester(data[data.length - 1]);
            } catch (err) {
                console.error("Error fetching results", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Loading Academic Records...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#2c3e50' }}>Academic Performance Overview</h2>

                <select
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                    onChange={(e) => setSelectedSemester(allData.find(s => s.semester === parseInt(e.target.value)))}
                    value={selectedSemester?.semester}
                >
                    {allData.map(sem => (
                        <option key={sem.semester} value={sem.semester}>{sem.label}</option>
                    ))}
                </select>
            </div>

            {selectedSemester ? (
                <>
                    {/* REGULAR RESULTS */}
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Regular Semester Results</h3>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Course</th>
                                    <th>CA (30)</th>
                                    <th>Final Exam (70)</th>
                                    <th>Total (100)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {(selectedSemester.regularResults?.$values || selectedSemester.regularResults || []).length > 0 ? (
                                    (selectedSemester.regularResults?.$values || selectedSemester.regularResults).map((res) => (
                                        <tr key={res.id} style={{
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: res.status === 'FAIL' ? '#fff5f5' : 'transparent'
                                        }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: 'bold' }}>{res.courseTitle}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{res.courseCode}</div>
                                            </td>
                                            <td>{res.ca?.toFixed(2)}</td>
                                            <td>{res.exam?.toFixed(2)}</td>
                                            <td style={{ fontWeight: 'bold' }}>{res.total?.toFixed(2)}%</td>
                                            <td style={{ color: res.status === 'PASS' ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                                                {res.status}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            Results for this semester have not been published by the Admin yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* SPECIAL RESULTS */}
                    {(selectedSemester.specialResults?.$values || selectedSemester.specialResults || []).length > 0 && (
                        <div style={{ backgroundColor: '#fdfdfd', padding: '20px', borderRadius: '10px', border: '1px dashed #cbd5e0' }}>
                            <h3 style={{ color: '#4a5568' }}>Clearance & Carry Attempts</h3>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', fontSize: '14px', color: '#718096' }}>
                                        <th style={{ padding: '10px' }}>Course</th>
                                        <th>Attempt Type</th>
                                        <th>CA (30)</th>
                                        <th>Exam Mark</th>
                                        <th>Final Result</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {(selectedSemester.specialResults?.$values || selectedSemester.specialResults || []).map((res) => (
                                        <tr key={res.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '10px', fontWeight: '500' }}>{res.courseTitle}</td>
                                            <td>
                                                <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#edf2f7' }}>
                                                    {res.type}
                                                </span>
                                            </td>
                                            <td>{res.type === 'Carry' ? '-' : res.ca?.toFixed(2)}</td>
                                            <td>{res.exam?.toFixed(2)}</td>
                                            <td style={{ fontWeight: 'bold' }}>{res.total?.toFixed(2)}%</td>
                                            <td style={{ color: res.status === 'PASS' ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                                                {res.status}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                    No finalized results found for your account yet.
                </div>
            )}
        </div>
    );
};

export default StudentResultsView;