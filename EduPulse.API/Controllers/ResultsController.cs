using EduPulse.API.Data;
using EduPulse.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EduPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ResultsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ResultsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("my-results")]
        public async Task<IActionResult> GetMyResults()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            // Get student current semester
            var student = await _context.Users.FindAsync(userId);
            if (student == null) return NotFound();

            var results = await _context.CourseResults
                .Include(cr => cr.Enrollment)
                    .ThenInclude(e => e.Course)
                .Where(cr => cr.Enrollment.StudentId == userId)
                .Select(cr => new
                {
                    cr.Id,
                    CourseTitle = cr.Enrollment.Course.Title,
                    CourseCode = cr.Enrollment.Course.Code,
                    Semester = cr.Enrollment.Course.TargetSemester,
                    CA = cr.ContinuousAssessmentMarks,
                    Exam = cr.FinalExamMarks,
                    Total = cr.TotalMarks,
                    Status = cr.IsPassed ? "PASS" : "FAIL",
                    Type = cr.AttemptType,
                    Date = cr.ResultPublishedAt
                })
                .ToListAsync();

            // Force all semesters up to current semester
            var finalGroupedList = new List<object>();

            for (int s = 1; s <= student.CurrentSemester; s++)
            {
                var semResults = results.Where(r => r.Semester == s).ToList();

                finalGroupedList.Add(new
                {
                    Semester = s,
                    Label = $"Year {(s + 1) / 2}, Semester {(s % 2 == 0 ? 2 : 1)}",
                    RegularResults = semResults.Where(r => r.Type == "Regular").ToList(),
                    SpecialResults = semResults.Where(r => r.Type != "Regular").ToList()
                });
            }

            return Ok(finalGroupedList);
        }

        // ✅ UPDATED METHOD (with double-check logic)
        [HttpGet("active-backlogs")]
        public async Task<IActionResult> GetActiveBacklogs()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var student = await _context.Users.FindAsync(userId);
            if (student == null) return NotFound();

            // 1. Get all enrollments for the student
            var enrollments = await _context.Enrollments
                .Include(e => e.Course)
                .Where(e => e.StudentId == userId && e.IsCompleted == false)
                .ToListAsync();

            var backlogs = new List<object>();

            foreach (var e in enrollments)
            {
                // 2. DOUBLE CHECK: Does this enrollment have a PASS result in history?
                var hasPassed = await _context.CourseResults
                    .AnyAsync(cr => cr.EnrollmentId == e.Id && cr.IsPassed);

                // If they passed, skip and auto-fix
                if (hasPassed)
                {
                    e.IsCompleted = true;
                    continue;
                }

                // 3. Add to backlog list
                backlogs.Add(new
                {
                    e.Id,
                    e.Course.Title,
                    e.Course.Code,
                    Semester = e.Course.TargetSemester,
                    Year = (e.Course.TargetSemester + 1) / 2,
                    SemNum = e.Course.TargetSemester % 2 == 0 ? 2 : 1,
                    Category = e.Course.TargetSemester < student.CurrentSemester ? "Carry" : "Clearance"
                });
            }

            await _context.SaveChangesAsync(); // Save auto-fixed flags
            return Ok(backlogs);
        }
    }
}