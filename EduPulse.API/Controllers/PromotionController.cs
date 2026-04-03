using EduPulse.API.Data;
using EduPulse.API.Models;
using EduPulse.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PromotionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PromotionService _promotionService;

        public PromotionController(ApplicationDbContext context, PromotionService promotionService)
        {
            _context = context;
            _promotionService = promotionService;
        }

        [HttpGet("batch-status")]
        public async Task<IActionResult> GetBatchStatus(int departmentId, int semester)
        {
            var students = await _context.Users
                .Where(u => u.DepartmentId == departmentId &&
                            u.CurrentSemester == semester &&
                            (int)u.Role == 2)
                .ToListAsync();

            var batchSummary = new List<object>();

            foreach (var student in students)
            {
                var allEnrollments = await _context.Enrollments
                    .Include(e => e.Course)
                    .Where(e => e.StudentId == student.Id)
                    .ToListAsync();

                int currentSemesterFails = 0;
                int totalActiveCarry = 0;
                var courseDetails = new List<object>();

                foreach (var enrollment in allEnrollments)
                {
                    var existingPass = await _context.CourseResults
                        .AnyAsync(cr => cr.EnrollmentId == enrollment.Id && cr.IsPassed);

                    if (existingPass) continue;

                    var liveResult = await _promotionService.CalculateCourseResult(enrollment.Id);

                    if (!liveResult.IsPassed)
                    {
                        totalActiveCarry++;

                        if (enrollment.Course.TargetSemester == semester)
                        {
                            currentSemesterFails++;
                            courseDetails.Add(new
                            {
                                CourseName = enrollment.Course.Title,
                                TotalMarks = liveResult.TotalMarks,
                                Status = "Fail"
                            });
                        }
                    }
                    else if (enrollment.Course.TargetSemester == semester)
                    {
                        courseDetails.Add(new
                        {
                            CourseName = enrollment.Course.Title,
                            TotalMarks = liveResult.TotalMarks,
                            Status = "Pass"
                        });
                    }
                }

                batchSummary.Add(new
                {
                    StudentId = student.Id,
                    StudentName = student.Name,
                    Courses = courseDetails,
                    CurrentFails = currentSemesterFails,
                    TotalActiveCarry = totalActiveCarry,
                    EligibleForPromotion = totalActiveCarry <= 2,
                    Action = totalActiveCarry <= 2 ? "Promote" : "Semester Drop"
                });
            }

            return Ok(batchSummary);
        }

        [HttpPost("publish-results")]
        public async Task<IActionResult> PublishResults(int departmentId, int semester)
        {
            var students = await _context.Users
                .Where(u => u.DepartmentId == departmentId &&
                            u.CurrentSemester == semester &&
                            (int)u.Role == 2)
                .ToListAsync();

            if (!students.Any()) return BadRequest("No students found in this batch.");

            foreach (var student in students)
            {
                var activeEnrollments = await _context.Enrollments
                    .Include(e => e.Course)
                    .Where(e => e.StudentId == student.Id)
                    .ToListAsync();

                int totalFails = 0;

                foreach (var enrollment in activeEnrollments)
                {
                    var alreadyPassed = await _context.CourseResults
                        .AnyAsync(cr => cr.EnrollmentId == enrollment.Id && cr.IsPassed);

                    if (alreadyPassed) continue;

                    var result = await _promotionService.CalculateCourseResult(enrollment.Id);

                    // 1. CLEAN UP OLD RECORDS
                    var oldResults = await _context.CourseResults
                        .Where(cr => cr.EnrollmentId == enrollment.Id)
                        .ToListAsync();
                    foreach (var old in oldResults) old.IsActiveCarryCourse = false;

                    // 2. SAVE NEW SNAPSHOT
                    _context.CourseResults.Add(result);

                    // Mark enrollment completion
                    if (result.IsPassed)
                    {
                        enrollment.IsCompleted = true;
                    }
                    else
                    {
                        totalFails++;
                        enrollment.IsCompleted = false;
                    }
                }

                // 3. PROMOTION LOGIC
                if (totalFails <= 2)
                {
                    student.CurrentSemester += 1;
                }
            }

            // ✅ --- ARCHIVE COMPLETED COURSES ---
            var coursesToArchive = await _context.Courses
                .Where(c => c.TargetDeptId == departmentId && c.TargetSemester == semester)
                .ToListAsync();

            foreach (var course in coursesToArchive)
            {
                course.IsArchived = true;
            }

            await _context.SaveChangesAsync(); // saves everything together

            return Ok(new { message = $"Batch promotion completed for {students.Count} students." });
        }
    }
}