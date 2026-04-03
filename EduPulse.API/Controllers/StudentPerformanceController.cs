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

            // 4. --- TIMELINE GENERATION (SEPARATED VIEW) ---
            var timeline = new List<PerformanceTimelinePoint>();

            // GROUP 1: ACADEMIC ASSESSMENTS ONLY (Left side of the chart)
            var academicPoints = new List<PerformanceTimelinePoint>();
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

                academicPoints.Add(new PerformanceTimelinePoint
                {
                    EventName = ass.Title,
                    Date = ass.Date.Date,
                    GradePercentage = pct
                    // Soft Skills intentionally left null so the dashed lines don't draw here
                });
            }

            // GROUP 2: BEHAVIORAL DAILY PULSE ONLY (Right side of the chart)
            var behavioralPoints = new List<PerformanceTimelinePoint>();
            var recentPresentDatesList = await _context.Attendances
                .Where(a => a.CourseId == courseId && a.StudentId == studentId && a.IsPresent == true)
                .Select(a => a.Date.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .Take(7)
                .ToListAsync();

            // Reverse so the chart draws left-to-right chronologically
            var recentPresentDates = recentPresentDatesList.OrderBy(d => d).ToList();

            foreach (var date in recentPresentDates)
            {
                var daysEntries = allSoftSkills.Where(s => s.Date.Date == date).ToList();

                double discipline = 4.0;
                double participation = 4.0;
                double collaboration = 4.0;

                if (daysEntries.Any())
                {
                    discipline = Math.Round(daysEntries.Average(s => (double)s.Discipline), 1);
                    participation = Math.Round(daysEntries.Average(s => (double)s.Participation), 1);
                    collaboration = Math.Round(daysEntries.Average(s => (double)s.Collaboration), 1);
                }

                behavioralPoints.Add(new PerformanceTimelinePoint
                {
                    EventName = date.ToString("MMM dd"),
                    Date = date,
                    // Grade Percentage intentionally left null so the blue line doesn't draw here
                    DisciplineRating = discipline,
                    ParticipationRating = participation,
                    CollaborationRating = collaboration
                });
            }

            // THE MAGIC TRICK: Add them sequentially! First all academics, then all behaviors.
            // This physically separates them on the X-Axis just like Image 2.
            timeline.AddRange(academicPoints);
            timeline.AddRange(behavioralPoints);

            return Ok(new AcademicHealthDashboardDto
            {
                StudentId = studentId,
                CourseId = courseId,
                CourseName = (await _context.Courses.FindAsync(courseId))?.Title ?? "Course",
                CurrentPercentage = currentPct,
                AcademicHealthStatus = healthStatus,
                Timeline = timeline
            });
        }
    }
}