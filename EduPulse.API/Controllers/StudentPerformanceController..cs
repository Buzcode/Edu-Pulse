using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduPulse.API.Data;
using EduPulse.API.DTOs;
using EduPulse.API.Models;
using EduPulse.API.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EduPulse.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentPerformanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAttendanceService _attendanceService;

        public StudentPerformanceController(ApplicationDbContext context, IAttendanceService attendanceService)
        {
            _context = context;
            _attendanceService = attendanceService;
        }

        [HttpGet("dashboard/{studentId}/{courseId}")]
        public async Task<IActionResult> GetStudentDashboard(int studentId, int courseId)
        {
            // 1. Validate Enrollment
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

            if (enrollment == null) return NotFound("Student not enrolled.");

            // 2. Fetch Base Data
            var assessments = await _context.Assessments.Where(a => a.CourseId == courseId).ToListAsync();
            var assessmentIds = assessments.Select(a => a.Id).ToList();

            var grades = await _context.Grades
                .Where(g => g.StudentId == studentId && assessmentIds.Contains(g.AssessmentId))
                .ToListAsync();

            // Fetch all attendances for the student in this course
            var attendances = await _context.Attendances
                .Where(a => a.CourseId == courseId && a.StudentId == studentId)
                .ToListAsync();

            // Fetch all soft skills for this enrollment
            var allSoftSkills = await _context.SoftSkills
                .Where(s => s.EnrollmentId == enrollment.Id)
                .ToListAsync();

            // 3. --- HEALTH BAR CALCULATION ---
            var attendanceSummary = await _attendanceService.CalculateStudentAttendanceAsync(courseId, studentId);
            double liveAttendancePoints = attendanceSummary.GradePoints;

            var quizGrades = grades
                .Where(g => assessments.Any(a => a.Id == g.AssessmentId && a.Type == AssessmentType.Quiz))
                .OrderByDescending(g => g.MarksObtained).Take(2).ToList();

            double weightedQuizzes = quizGrades.Any() ? quizGrades.Average(g => (double)g.MarksObtained) : 0;
            var finalExam = assessments.FirstOrDefault(a => a.Type == AssessmentType.FinalExam);
            var finalGrade = grades.FirstOrDefault(g => g.AssessmentId == finalExam?.Id);
            double weightedFinal = finalGrade != null ? (double)finalGrade.MarksObtained : 0;

            double currentPct = Math.Round(Math.Min(liveAttendancePoints + weightedQuizzes + weightedFinal, 100), 1);
            string healthStatus = currentPct >= 70 ? "On Track" : (currentPct >= 40 ? "Needs Improvement" : "At Risk");

            // 4. --- TIMELINE GENERATION ---
            var timeline = new List<PerformanceTimelinePoint>();

            // GROUP 1: ACADEMIC ASSESSMENTS
            foreach (var ass in assessments.OrderBy(a => a.Date))
            {
                double? pct = null;
                if (ass.Type == AssessmentType.Attendance)
                    pct = ass.MaxMarks > 0 ? Math.Round((liveAttendancePoints / ass.MaxMarks) * 100, 1) : 0;
                else
                {
                    var grade = grades.FirstOrDefault(g => g.AssessmentId == ass.Id);
                    if (grade != null && ass.MaxMarks > 0)
                        pct = Math.Round(((double)grade.MarksObtained / ass.MaxMarks) * 100, 1);
                }

                timeline.Add(new PerformanceTimelinePoint
                {
                    EventName = ass.Title,
                    Date = ass.Date.Date,
                    GradePercentage = pct
                });
            }

            // GROUP 2: BEHAVIORAL DAILY PULSE (LAST 7 PRESENT DAYS)
            // 1. Get the list of the last 7 dates the student was present
            var presentDates = attendances
                .Where(a => a.IsPresent)
                .OrderByDescending(a => a.Date)
                .Take(7)
                .OrderBy(a => a.Date)
                .Select(a => a.Date.Date)
                .ToList();

            // 2. Loop through those specific attendance dates
            foreach (var date in presentDates)
            {
                // Check if there is a manual rating for this exact attendance date
                var dayEntry = allSoftSkills.FirstOrDefault(s => s.LastUpdated.Date == date);

                double disc = dayEntry != null ? dayEntry.Discipline : 4.0;
                double part = dayEntry != null ? dayEntry.Participation : 4.0;
                double coll = dayEntry != null ? dayEntry.Collaboration : 4.0;

                timeline.Add(new PerformanceTimelinePoint
                {
                    EventName = date.ToString("MMM dd"),
                    Date = date,
                    DisciplineRating = disc,
                    ParticipationRating = part,
                    CollaborationRating = coll
                });
            }

            // 5. Final Result Construction
            var course = await _context.Courses.FindAsync(courseId);
            var courseName = course?.Title ?? "Course";

            return Ok(new AcademicHealthDashboardDto
            {
                StudentId = studentId,
                CourseId = courseId,
                CourseName = courseName,
                CurrentPercentage = currentPct,
                AcademicHealthStatus = healthStatus,
                Timeline = timeline
            });
        }
    }
}