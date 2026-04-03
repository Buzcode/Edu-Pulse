import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClearanceCarryView = () => {
    const [backlogs, setBacklogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBacklogs = async () => {
            try {
                const token = sessionStorage.getItem('ACCESS_TOKEN');
                const res = await axios.get(`https://localhost:7096/api/Results/active-backlogs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBacklogs(res.data.$values || res.data);
            } catch (err) {
                console.error("Error fetching backlogs", err);
            }
            setLoading(false);
        };
        fetchBacklogs();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Loading records...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Clearance & Carry Courses</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                The following courses require a passing grade to be cleared from your active records.
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
                            borderRadius: '8px',
                            borderLeft: `5px solid ${item.category === 'Carry' ? '#e67e22' : '#3498db'}`,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.title}</div>
                                <div style={{ fontSize: '13px', color: '#888' }}>{item.code} • Year {item.year}, Sem {item.semNum}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    backgroundColor: item.category === 'Carry' ? '#fffaf0' : '#ebf8ff',
                                    color: item.category === 'Carry' ? '#9c4221' : '#2b6cb0',
                                    border: `1px solid ${item.category === 'Carry' ? '#fbd38d' : '#bee3f8'}`
                                }}>
                                    {item.category}
                                </span>
                                <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '5px' }}>Status: Unresolved</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f7fafc', borderRadius: '10px', color: '#4a5568' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
                    <h3>All Clear!</h3>
                    <p>You have no active clearance or carry courses.</p>
                </div>
            )}
        </div>
    );
};

export default ClearanceCarryView;