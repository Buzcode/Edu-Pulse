import React from 'react';

const Placeholder = ({ title }) => {
    return (
        <div className="user-info-card" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h1 style={{ color: '#2d6a4f', fontSize: '3rem' }}>🚧</h1>
            <h2>{title} Page</h2>
            <p style={{ color: '#666' }}>This feature is currently under development for the EduPulse system.</p>
            <button
                className="btn-primary"
                style={{ width: 'auto', marginTop: '20px' }}
                onClick={() => window.history.back()}
            >
                Go Back
            </button>
        </div>
    );
};

export default Placeholder;