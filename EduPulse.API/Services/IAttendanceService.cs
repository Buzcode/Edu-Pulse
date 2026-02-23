using EduPulse.API.DTOs;
using EduPulse.API.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EduPulse.API.Services
{
    public interface IAttendanceService
    {
        Task MarkAttendanceAsync(MarkAttendanceRequest request);
        Task<AttendanceSummaryDto> CalculateStudentAttendanceAsync(int courseId, int studentId);
        Task<List<Attendance>> GetCourseAttendanceHistoryAsync(int courseId);

        // ✅ MAKE SURE THESE ARE ADDED
        Task<List<Attendance>> GetAttendanceByDateAsync(int courseId, DateTime date);
        Task DeleteAttendanceByDateAsync(int courseId, DateTime date);
    }
}