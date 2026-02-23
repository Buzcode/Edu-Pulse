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
            // 1. Pre-fetch enrollments for this course
            var courseEnrollments = await _context.Enrollments
                .Where(e => e.CourseId == request.CourseId)
                .ToListAsync();

            /* --- SOFTSKILL PART REMOVED TEMPORARILY ---
            var existingSoftSkills = await _context.SoftSkills
                .Include(s => s.Enrollment)
                .Where(s => s.Enrollment != null && s.Enrollment.CourseId == request.CourseId && s.Date.Date == request.Date.Date)
                .ToListAsync();
            */

            foreach (var item in request.Students)
            {
                // --- Part A: Handle Attendance Record ---
                var existingAttendance = await _context.Attendances.FirstOrDefaultAsync(a =>
                    a.CourseId == request.CourseId &&
                    a.StudentId == item.StudentId &&
                    a.Date.Date == request.Date.Date);

                if (existingAttendance != null)
                {
                    existingAttendance.IsPresent = item.IsPresent;
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

                // --- Part B: The "Daily Pulse" Sync Logic (SOFTSKILL) ---
                /* --- COMMENTED OUT FOR TEAMMATE ---
                if (item.IsPresent)
                {
                    var enrollment = courseEnrollments.FirstOrDefault(e => e.StudentId == item.StudentId);
                    if (enrollment != null)
                    {
                        bool skillAlreadyExists = existingSoftSkills.Any(s => s.EnrollmentId == enrollment.Id);
                        if (!skillAlreadyExists)
                        {
                            var newSoftSkill = new SoftSkill
                            {
                                EnrollmentId = enrollment.Id,
                                Date = request.Date,
                                Discipline = 4,
                                Participation = 4,
                                Collaboration = 4,
                                LastUpdated = DateTime.Now
                            };
                            _context.SoftSkills.Add(newSoftSkill);
                        }
                    }
                }
                */
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
            double attendanceMarks = (percentage / 100.0) * 10.0;

            return new AttendanceSummaryDto
            {
                TotalClasses = totalClasses,
                AttendedClasses = attended,
                Percentage = Math.Round(percentage, 2),
                GradePoints = (int)Math.Round(attendanceMarks)
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
            var attendanceRecords = _context.Attendances
                .Where(a => a.CourseId == courseId && a.Date.Date == date.Date);

            /* --- SOFTSKILL PART REMOVED ---
            var softSkillRecords = _context.SoftSkills
                .Where(s => s.Enrollment != null && s.Enrollment.CourseId == courseId && s.Date.Date == date.Date);
            _context.SoftSkills.RemoveRange(softSkillRecords);
            */

            _context.Attendances.RemoveRange(attendanceRecords);
            await _context.SaveChangesAsync();
        }
    }
}