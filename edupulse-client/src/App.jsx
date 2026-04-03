import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Page Imports ---
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // IUMS User Home (The high-level Profile Card)
import TeacherCourses from './pages/TeacherCourses';
import CourseDetails from './pages/CourseDetails';
import CourseContent from './pages/CourseContent';
import Gradebook from './pages/Gradebook';
import StudentGradeView from './pages/StudentGradeView';
import AttendanceMarking from './pages/AttendanceMarking';
import AttendanceSheet from './pages/AttendanceSheet';
import BatchPromotion from './pages/BatchPromotion';

// --- New IUMS Style Page Imports ---
import EnrolledCourses from './pages/EnrolledCourses';
import Placeholder from './pages/Placeholder';
import StudentResultsView from './pages/StudentResultsView';
// --- Component Imports ---
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import TeacherProfile from './pages/TeacherProfile';
import AdminProfile from './pages/AdminProfile';
import TeacherApprovals from './pages/TeacherApprovals';
import ClearanceCarry from './pages/ClearanceCarry';
import ArchivedCourses from './pages/ArchivedCourses';

function App() {
    return (
        <Router>
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* PROTECTED ROUTES */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <Routes>
                                    {/* --- Shared / Home Routes --- */}
                                    <Route path="/dashboard" element={<Dashboard />} />


                                    <Route path="/profile" element={<Dashboard />} />
                                    <Route path="/teacher-profile" element={<ProtectedRoute requiredRole="Teacher"><TeacherProfile /></ProtectedRoute>} />
                                    <Route path="/admin-profile" element={<ProtectedRoute requiredRole="Admin"><Dashboard /></ProtectedRoute>} />
                                    <Route
                                        path="/admin/teacher-approvals"
                                        element={
                                            <ProtectedRoute requiredRole="Admin">
                                                <TeacherApprovals />
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Both Teachers and Students can view specific course materials */}
                                    <Route path="/course-content/:id" element={<CourseContent />} />

                                    <Route
                                        path="/enrolled-courses"
                                        element={
                                            <ProtectedRoute requiredRole="Student">
                                                <EnrolledCourses />
                                            </ProtectedRoute>
                                        }
                                    />


                                    {/* Student Placeholders */}
                                    <Route path="/evaluation" element={<ProtectedRoute requiredRole="Student"><Placeholder title="Teacher Evaluation" /></ProtectedRoute>} />
                                    <Route
                                        path="/results"
                                        element={
                                            <ProtectedRoute requiredRole="Student">
                                                <StudentResultsView />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path="/payments" element={<ProtectedRoute requiredRole="Student"><Placeholder title="Payments & History" /></ProtectedRoute>} />
                                    <Route path="/semester-fee" element={<ProtectedRoute requiredRole="Student"><Placeholder title="Semester Fee" /></ProtectedRoute>} />
                                    <Route
                                        path="/clearance"
                                        element={
                                            <ProtectedRoute requiredRole="Student">
                                                <ClearanceCarry />
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Student single course result view */}
                                    <Route path="/student/result/:courseId" element={<ProtectedRoute requiredRole="Student"><StudentGradeView /></ProtectedRoute>} />

                                    {/* --- Teacher Specific Pages --- */}
                                    <Route
                                        path="/teacher-courses"
                                        element={
                                            <ProtectedRoute requiredRole="Teacher">
                                                <TeacherCourses />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/archived-courses"
                                        element={
                                            <ProtectedRoute requiredRole="Teacher">
                                                <ArchivedCourses />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path="/course-details/:id" element={<ProtectedRoute requiredRole="Teacher"><CourseDetails /></ProtectedRoute>} />
                                    <Route path="/course/:courseId/gradebook" element={<ProtectedRoute requiredRole="Teacher"><Gradebook /></ProtectedRoute>} />
                                    <Route path="/attendance/:courseId" element={<ProtectedRoute requiredRole="Teacher"><AttendanceMarking /></ProtectedRoute>} />
                                    <Route path="/attendance-sheet/:courseId" element={<ProtectedRoute requiredRole="Teacher"><AttendanceSheet /></ProtectedRoute>} />
                                    <Route path="/grading-overview" element={<ProtectedRoute requiredRole="Teacher"><Placeholder title="Grading Management" /></ProtectedRoute>} />

                                    {/* --- Admin Specific Pages --- */}
                                    <Route
                                        path="/admin/batch-promotion"
                                        element={
                                            <ProtectedRoute requiredRole="Admin">
                                                <BatchPromotion />
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* --- Catch-all redirect --- */}
                                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;