using EduPulse.API.Data;
using EduPulse.API.Models;
using EduPulse.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EduPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GradesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAttendanceService _attendanceService;

        public GradesController(ApplicationDbContext context, IAttendanceService attendanceService)
        {
            _context = context;
            _attendanceService = attendanceService;
        }

        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetCourseGradebook(int courseId)
        {
            var assessments = await _context.Assessments
                .Where(a => a.CourseId == courseId)
                .OrderBy(a => a.Date)
                .AsNoTracking().ToListAsync();

            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == courseId)
                .Include(e => e.Student)
                .AsNoTracking().ToListAsync();

            var assessmentIds = assessments.Select(a => a.Id).ToList();
            var grades = await _context.Grades
                .Where(g => assessmentIds.Contains(g.AssessmentId)).ToListAsync();

            var attendanceAssessment = assessments.FirstOrDefault(a => a.Type == AssessmentType.Attendance);
            if (attendanceAssessment != null)
            {
                foreach (var enrollment in enrollments)
                {
                    var summary = await _attendanceService.CalculateStudentAttendanceAsync(courseId, enrollment.StudentId);
                    var existingGrade = grades.FirstOrDefault(g => g.AssessmentId == attendanceAssessment.Id && g.StudentId == enrollment.StudentId);
                    if (existingGrade != null) existingGrade.MarksObtained = summary.GradePoints;
                    else grades.Add(new Grade { AssessmentId = attendanceAssessment.Id, StudentId = enrollment.StudentId, MarksObtained = summary.GradePoints });
                }
            }

            return Ok(new { Assessments = assessments, Grades = grades, Students = enrollments.Select(e => new { StudentId = e.StudentId, Name = e.Student?.Name ?? "Unknown" }) });
        }

        [HttpPost("bulk-update")]
        public async Task<IActionResult> BulkUpdateGrades([FromBody] List<Grade> grades)
        {
            foreach (var grade in grades)
            {
                var existing = await _context.Grades.FirstOrDefaultAsync(g => g.AssessmentId == grade.AssessmentId && g.StudentId == grade.StudentId);
                if (existing != null) existing.MarksObtained = grade.MarksObtained;
                else { grade.Id = 0; _context.Grades.Add(grade); }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Grades updated successfully" });
        }

        [HttpGet("student/{courseId}")]
        public async Task<IActionResult> GetMyCourseGrades(int courseId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int studentId = int.Parse(userIdClaim.Value);

            var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == courseId);
            if (course == null) return NotFound("Course not found");

            var assessments = await _context.Assessments
                .Where(a => a.CourseId == courseId)
                .OrderBy(a => a.Date).AsNoTracking().ToListAsync();

            var grades = await _context.Grades
                .Where(g => g.StudentId == studentId && assessments.Select(a => a.Id).Contains(g.AssessmentId))
                .AsNoTracking().ToListAsync();

            var attAssessment = assessments.FirstOrDefault(a => a.Type == AssessmentType.Attendance);
            if (attAssessment != null)
            {
                var summary = await _attendanceService.CalculateStudentAttendanceAsync(courseId, studentId);
                var attGrade = grades.FirstOrDefault(g => g.AssessmentId == attAssessment.Id);
                if (attGrade != null) attGrade.MarksObtained = summary.GradePoints;
                else grades.Add(new Grade { AssessmentId = attAssessment.Id, StudentId = studentId, MarksObtained = summary.GradePoints });
            }

            return Ok(new { CourseCode = course.Code, Assessments = assessments, Grades = grades });
        }
    }
}