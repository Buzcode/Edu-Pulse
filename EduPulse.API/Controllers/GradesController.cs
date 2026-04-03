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

        // --- METHOD 1: TEACHER VIEWS GRADEBOOK ---
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetCourseGradebook(int courseId)
        {
            // 1. Get Assessments
            var assessments = await _context.Assessments
                .Where(a => a.CourseId == courseId)
                .OrderBy(a => a.Date)
                .AsNoTracking()
                .ToListAsync();

            // 2. Get Enrollments (Students)
            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == courseId)
                .Include(e => e.Student)
                .AsNoTracking()
                .ToListAsync();

            // 3. Get Grades
            var assessmentIds = assessments.Select(a => a.Id).ToList();
            var grades = await _context.Grades
                .Where(g => assessmentIds.Contains(g.AssessmentId))
                .AsNoTracking()
                .ToListAsync();

            // 4. Inject LIVE Attendance
            // We look for Type == 0 (Attendance)
            var attendanceAssessment = assessments.FirstOrDefault(a => (int)a.Type == 0);

            if (attendanceAssessment != null)
            {
                foreach (var enrollment in enrollments)
                {
                    try
                    {
                        var summary = await _attendanceService.CalculateStudentAttendanceAsync(courseId, enrollment.StudentId);
                        var existingGrade = grades.FirstOrDefault(g =>
                            g.AssessmentId == attendanceAssessment.Id &&
                            g.StudentId == enrollment.StudentId);

                        if (existingGrade != null)
                        {
                            existingGrade.MarksObtained = summary.GradePoints;
                        }
                        else
                        {
                            grades.Add(new Grade
                            {
                                AssessmentId = attendanceAssessment.Id,
                                StudentId = enrollment.StudentId,
                                MarksObtained = summary.GradePoints
                            });
                        }
                    }
                    catch { /* Ignore calculation errors */ }
                }
            }

            // ✅ CRITICAL FIX: Manually Map the data to prevent JSON crashes
            // This ensures we only send the ID, Title, etc., and NOT the relationships
            return Ok(new
            {
                Assessments = assessments.Select(a => new {
                    a.Id,
                    a.Title,
                    a.Type,
                    a.MaxMarks,
                    a.Date
                }),
                Grades = grades.Select(g => new {
                    g.Id,
                    g.AssessmentId,
                    g.StudentId,
                    g.MarksObtained
                }),
                Students = enrollments.Select(e => new
                {
                    StudentId = e.StudentId,
                    Name = e.Student != null ? e.Student.Name : "Unknown"
                })
            });
        }

        // --- METHOD 2: BULK UPDATE ---
        [HttpPost("bulk-update")]
        public async Task<IActionResult> BulkUpdateGrades([FromBody] List<GradeUpdateDto> updates)
        {
            if (updates == null || !updates.Any()) return BadRequest("No data provided");

            foreach (var update in updates)
            {
                var existing = await _context.Grades
                    .FirstOrDefaultAsync(g => g.AssessmentId == update.AssessmentId && g.StudentId == update.StudentId);

                if (existing != null)
                {
                    existing.MarksObtained = update.MarksObtained;
                }
                else
                {
                    _context.Grades.Add(new Grade
                    {
                        StudentId = update.StudentId,
                        AssessmentId = update.AssessmentId,
                        MarksObtained = update.MarksObtained,
                        DateEntered = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Grades updated successfully" });
        }

        // --- METHOD 3: STUDENT VIEW ---
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
                .OrderBy(a => a.Date)
                .AsNoTracking()
                .ToListAsync();

            var assessmentIds = assessments.Select(a => a.Id).ToList();
            var grades = await _context.Grades
                .Where(g => g.StudentId == studentId && assessmentIds.Contains(g.AssessmentId))
                .AsNoTracking()
                .ToListAsync();

            // Inject Attendance
            var attAssessment = assessments.FirstOrDefault(a => (int)a.Type == 0);
            if (attAssessment != null)
            {
                try
                {
                    var summary = await _attendanceService.CalculateStudentAttendanceAsync(courseId, studentId);
                    var attGrade = grades.FirstOrDefault(g => g.AssessmentId == attAssessment.Id);
                    if (attGrade != null) attGrade.MarksObtained = summary.GradePoints;
                    else grades.Add(new Grade { AssessmentId = attAssessment.Id, StudentId = studentId, MarksObtained = summary.GradePoints });
                }
                catch { }
            }

            // ✅ SAFE RETURN MAPPING
            return Ok(new
            {
                CourseTitle = course.Title,
                CourseCode = course.Code,
                Policy = course.GradingPolicy,
                Assessments = assessments.Select(a => new { a.Id, a.Title, a.Type, a.MaxMarks, a.Date }),
                Grades = grades.Select(g => new { g.Id, g.AssessmentId, g.StudentId, g.MarksObtained })
            });
        }

        // --- METHOD 4: GAP ANALYSIS ---
        [HttpGet("gap-analysis/{courseId}")]
        public async Task<IActionResult> GetGapAnalysis(int courseId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int studentId = int.Parse(userIdClaim.Value);

            var assessments = await _context.Assessments
                .Where(a => a.CourseId == courseId)
                .OrderBy(a => a.Date)
                .AsNoTracking()
                .ToListAsync();

            var result = new List<object>();

            foreach (var a in assessments)
            {
                double myMark = 0;
                double classAvg = 0;

                try
                {
                    if ((int)a.Type == 0) // Attendance
                    {
                        var myAttd = await _attendanceService.CalculateStudentAttendanceAsync(courseId, studentId);
                        myMark = myAttd.GradePoints;
                        classAvg = 8.5;
                    }
                    else
                    {
                        var myGrade = await _context.Grades
                            .Where(g => g.AssessmentId == a.Id && g.StudentId == studentId)
                            .Select(g => g.MarksObtained)
                            .FirstOrDefaultAsync();

                        myMark = myGrade;

                        var classGrades = await _context.Grades
                            .Where(g => g.AssessmentId == a.Id)
                            .Select(g => g.MarksObtained)
                            .ToListAsync();

                        if (classGrades.Any()) classAvg = classGrades.Average();
                    }

                    double max = a.MaxMarks > 0 ? a.MaxMarks : 100;

                    result.Add(new
                    {
                        AssessmentTitle = a.Title,
                        MyPercentage = Math.Round((myMark / max) * 100, 1),
                        ClassAveragePercentage = Math.Round((classAvg / max) * 100, 1)
                    });
                }
                catch { /* Skip */ }
            }

            return Ok(result);
        }
    }

    public class GradeUpdateDto
    {
        public int StudentId { get; set; }
        public int AssessmentId { get; set; }
        public double MarksObtained { get; set; }
    }
}