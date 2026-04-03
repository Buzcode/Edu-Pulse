import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClearanceCarry = () => {
    const [backlogs, setBacklogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBacklogs = async () => {
            try {
                const token = sessionStorage.getItem('ACCESS_TOKEN');
                const res = await axios.get(`https://localhost:7096/api/Results/active-backlogs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBacklogs(res.data.$values || res.data || []);
            } catch (err) {
                console.error("Error fetching backlogs", err);
            }
            setLoading(false);
        };
        fetchBacklogs();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading academic records...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '5px' }}>Clearance & Carry Tracker</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                These courses must be passed to be cleared from your active record.
            </p>

            {backlogs.length > 0 ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {backlogs.map((item) => (
                        <div key={item.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            borderLeft: `6px solid ${item.category === 'Carry' ? '#f6ad55' : '#4299e1'}`,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2d3748' }}>{item.title}</div>
                                <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
                                    {item.code} • Year {item.year}, Semester {item.semNum}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    backgroundColor: item.category === 'Carry' ? '#fffaf0' : '#ebf8ff',
                                    color: item.category === 'Carry' ? '#c05621' : '#2b6cb0',
                                    border: `1px solid ${item.category === 'Carry' ? '#fbd38d' : '#bee3f8'}`
                                }}>
                                    {item.category}
                                </span>
                                <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '8px' }}>Status: UNRESOLVED</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f7fafc', borderRadius: '15px', color: '#4a5568', border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌟</div>
                    <h3 style={{ fontSize: '1.5rem' }}>Your Record is Clean!</h3>
                    <p>You have no active clearance or carry courses.</p>
                </div>
            )}
        </div>
    );
};

export default ClearanceCarry;