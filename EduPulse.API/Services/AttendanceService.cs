using EduPulse.API.Data;
using EduPulse.API.DTOs;
using EduPulse.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EduPulse.API.Services
{
    public class AttendanceService : IAttendanceService
    {
        private readonly ApplicationDbContext _context;

        public AttendanceService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================
        // MARK ATTENDANCE
        // ============================
        public async Task MarkAttendanceAsync(MarkAttendanceRequest request)
        {
            foreach (var item in request.Students)
            {
                var existing = await _context.Attendances.FirstOrDefaultAsync(a =>
                    a.CourseId == request.CourseId &&
                    a.StudentId == item.StudentId &&
                    a.Date.Date == request.Date.Date);

                if (existing != null)
                {
                    existing.IsPresent = item.IsPresent;
                }
                else
                {
                    _context.Attendances.Add(new Attendance
                    {
                        CourseId = request.CourseId,
                        StudentId = item.StudentId,
                        Date = request.Date,
                        IsPresent = item.IsPresent
                    });
                }
            }

            await _context.SaveChangesAsync();
        }

        // ============================
        // ATTENDANCE CALCULATION (OUT OF 10)
        // ============================
        public async Task<AttendanceSummaryDto> CalculateStudentAttendanceAsync(int courseId, int studentId)
        {
            var studentRecords = await _context.Attendances
                .Where(a => a.CourseId == courseId && a.StudentId == studentId)
                .ToListAsync();

            var totalClasses = await _context.Attendances
                .Where(a => a.CourseId == courseId)
                .Select(a => a.Date.Date)
                .Distinct()
                .CountAsync();

            if (totalClasses == 0)
            {
                return new AttendanceSummaryDto
                {
                    TotalClasses = 0,
                    AttendedClasses = 0,
                    Percentage = 0,
                    GradePoints = 0
                };
            }

            int attended = studentRecords.Count(a => a.IsPresent);

            double percentage = ((double)attended / totalClasses) * 100;

            // ✅ REAL attendance marks out of 10
            double attendanceMarks = (percentage / 100.0) * 10.0;

            return new AttendanceSummaryDto
            {
                TotalClasses = totalClasses,
                AttendedClasses = attended,
                Percentage = Math.Round(percentage, 2),

                // If GradePoints is INT in DTO:
                GradePoints = (int)Math.Round(attendanceMarks)

                // 👉 If you later change DTO to double:
                // GradePoints = Math.Round(attendanceMarks, 2)
            };
        }

        // ============================
        // COURSE HISTORY
        // ============================
        public async Task<List<Attendance>> GetCourseAttendanceHistoryAsync(int courseId)
        {
            return await _context.Attendances
                .Where(a => a.CourseId == courseId)
                .OrderBy(a => a.Date)
                .ToListAsync();
        }

        // ============================
        // GET BY DATE
        // ============================
        public async Task<List<Attendance>> GetAttendanceByDateAsync(int courseId, DateTime date)
        {
            return await _context.Attendances
                .Where(a => a.CourseId == courseId && a.Date.Date == date.Date)
                .ToListAsync();
        }

        // ============================
        // DELETE BY DATE
        // ============================
        public async Task DeleteAttendanceByDateAsync(int courseId, DateTime date)
        {
            var records = _context.Attendances
                .Where(a => a.CourseId == courseId && a.Date.Date == date.Date);

            _context.Attendances.RemoveRange(records);
            await _context.SaveChangesAsync();
        }
    }
}