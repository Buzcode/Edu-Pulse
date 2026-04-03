import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import austImage from '../assets/aust.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await API.post('/Auth/login', { email, password });
            login(response.data, response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data || "Login failed. Please try again.");
        }
    };

    return (
        <div className="split-login-container">
            <div className="login-image-side" style={{ backgroundImage: `url(${austImage})` }}>
                <div className="image-overlay"></div>
            </div>

            <div className="login-form-side">
                <div className="login-content-wrapper">
                    <div className="iums-header-branding">
                        
                    </div>

                    <div className="sign-in-section">
                        <h2 className="sign-in-heading">Sign in with your EduPulse Id</h2>
                        <div className="heading-underline"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="iums-login-form" autoComplete="off">
                        {error && <div className="error-msg">{error}</div>}

                        <div className="form-group">
                            <label className="iums-label">User Email / ID</label>
                            <input
                                type="email"
                                className="iums-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                /* RESTORED SECURITY TRICK */
                                autoComplete="off"
                                readOnly={true}
                                onFocus={(e) => e.target.removeAttribute('readonly')}
                            />
                        </div>

                        <div className="form-group">
                            <label className="iums-label">Password</label>
                            <input
                                type="password"
                                className="iums-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                /* RESTORED SECURITY TRICK */
                                autoComplete="new-password"
                                readOnly={true}
                                onFocus={(e) => e.target.removeAttribute('readonly')}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="iums-btn-sign-in">
                                Sign in
                            </button>
                            <span className="forgot-pass-link">Forgot password?</span>
                        </div>
                    </form>

                    <p className="signup-notice">
                        Don't have an account? <span onClick={() => navigate('/register')} className="signup-link">Sign Up</span>
                    </p>

                    <footer className="login-page-footer">
                        2026 © - EduPulse University of Science and Technology
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default Login;