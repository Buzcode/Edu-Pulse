using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduPulse.API.Data;
using EduPulse.API.DTOs;
using EduPulse.API.Models;
using EduPulse.API.Services;

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

            // FIX: Extract IDs to a simple list first to ensure EF Core translates the SQL IN clause correctly
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

            // 4. --- TIMELINE GENERATION (FIXED) ---

            var timeline = new List<PerformanceTimelinePoint>();

            // STEP A: Add ALL Academic Assessments 
            // We use a List (not a Dictionary) so if 2 exams happen on the same day, both are shown.
            foreach (var ass in assessments)
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
                    // Soft skills will be injected in Step C
                });
            }

            // STEP B: Identify "Recent 7" Soft Skill Days
            var recentSoftSkillDates = allSoftSkills
                .Select(s => s.Date.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .Take(7)
                .ToHashSet();

            // Find days that have Soft Skills but NO Assessment (so the line doesn't break)
            var existingAssessmentDates = timeline.Select(t => t.Date).ToHashSet();

            foreach (var date in recentSoftSkillDates)
            {
                if (!existingAssessmentDates.Contains(date))
                {
                    timeline.Add(new PerformanceTimelinePoint
                    {
                        EventName = date.ToString("MMM dd"),
                        Date = date,
                        GradePercentage = null // No blue dot, just behavioral
                    });
                }
            }

            // STEP C: Inject Soft Skill Ratings into the Timeline
            // We loop through the whole timeline. If a point's date matches our "Recent 7", we add the ratings.
            foreach (var point in timeline)
            {
                if (recentSoftSkillDates.Contains(point.Date))
                {
                    // Get entries strictly for THIS day
                    var daysEntries = allSoftSkills.Where(s => s.Date.Date == point.Date).ToList();

                    if (daysEntries.Any())
                    {
                        point.DisciplineRating = Math.Round(daysEntries.Average(s => (double)s.Discipline), 1);
                        point.ParticipationRating = Math.Round(daysEntries.Average(s => (double)s.Participation), 1);
                        point.CollaborationRating = Math.Round(daysEntries.Average(s => (double)s.Collaboration), 1);
                    }
                }
            }

            // Final Sort
            timeline = timeline.OrderBy(t => t.Date).ToList();

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