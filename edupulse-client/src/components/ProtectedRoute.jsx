import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    // If user is null, they are not logged in for this specific session/tab
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role-based authorization
    if (requiredRole && user.role !== requiredRole) {
        alert("Access Denied: You do not have permission to view this page.");
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;