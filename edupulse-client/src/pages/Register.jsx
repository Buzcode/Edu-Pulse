import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'Student',
        departmentId: '', year: '', semester: '', verificationKey: ''
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        API.get('/Departments').then(res => setDepartments(res.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            departmentId: parseInt(formData.departmentId)
        };

        if (formData.role === 'Student') {
            payload.year = parseInt(formData.year);
            payload.semester = parseInt(formData.semester);
        } else {
            payload.verificationKey = formData.verificationKey;
        }

        try {
            await API.post('/Auth/register', payload);
            alert("Registration Successful! You can now login.");
            navigate('/login');
        } catch (err) {
            const backendError = err.response?.data;
            if (typeof backendError === 'string') {
                setError(backendError);
            } else if (backendError?.errors) {
                const firstErrorKey = Object.keys(backendError.errors)[0];
                setError(backendError.errors[firstErrorKey][0]);
            } else {
                setError("Registration failed. Please check your data.");
            }
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card auth-card-register">
                <form onSubmit={handleSubmit}>
                    <h2>EduPulse Sign Up</h2>

                    {error && <div className="error-msg">{error}</div>}

                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="form-input" onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-input" onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-input" onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <select className="form-input" onChange={e => setFormData({ ...formData, departmentId: e.target.value })} required>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    {formData.role === 'Student' && (
                        <div className="student-fields">
                            <div className="form-group">
                                <label>Year</label>
                                <input type="number" className="form-input" min="1" max="4" onChange={e => setFormData({ ...formData, year: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Semester</label>
                                <input type="number" className="form-input" min="1" max="2" onChange={e => setFormData({ ...formData, semester: e.target.value })} required />
                            </div>
                        </div>
                    )}

                    {formData.role === 'Teacher' && (
                        <div className="form-group">
                            <label>Secret Key</label>
                            <input type="password" placeholder="Departmental Key" className="form-input" onChange={e => setFormData({ ...formData, verificationKey: e.target.value })} required />
                        </div>
                    )}

                    <button type="submit" className="btn-primary btn-signup">Sign Up</button>

                    <p className="auth-footer-text">
                        Already have an account? <span className="auth-footer-link" onClick={() => navigate('/login')}>Login</span>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
