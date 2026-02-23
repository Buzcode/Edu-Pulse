import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TeacherCourses from './pages/TeacherCourses';
import ProtectedRoute from './components/ProtectedRoute';
import CourseDetails from './pages/CourseDetails';
import CourseContent from './pages/CourseContent';
import Gradebook from './pages/Gradebook';
import StudentGradeView from './pages/StudentGradeView';
import AttendanceMarking from './pages/AttendanceMarking';
import AttendanceSheet from './pages/AttendanceSheet';

function App() {
    return (
        <Router>
            <Routes>

                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teacher-courses"
                    element={
                        <ProtectedRoute requiredRole="Teacher">
                            <TeacherCourses />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/course-details/:id"
                    element={
                        <ProtectedRoute requiredRole="Teacher">
                            <CourseDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Accessible by BOTH Teacher & Student */}
                <Route
                    path="/course-content/:id"
                    element={
                        <ProtectedRoute>
                            <CourseContent />
                        </ProtectedRoute>
                    }
                />

                <Route path="/course/:courseId/gradebook" element={<Gradebook />} />

                {/* ✅ NEW: Teacher Attendance Page */}
                <Route path="/attendance/:courseId" element={<AttendanceMarking />} />
                <Route path="/attendance-sheet/:courseId" element={<AttendanceSheet />} />

                {/* ✅ NEW: Student Result Page */}
                <Route path="/student/result/:courseId" element={<StudentGradeView />} />

                {/* ⚠️ Catch-all MUST be at the very bottom */}
                <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
        </Router>
    );
}

export default App;