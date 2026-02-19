import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    // 1. Not logged in at all
    if (!user) {
        return <Navigate to="/login" />;
    }

    // 2. Logged in, but role doesn't match (e.g., Student trying to see Teacher pages)
    if (requiredRole && user.role !== requiredRole) {
        alert("Access Denied: You do not have permission to view this page.");
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default ProtectedRoute;