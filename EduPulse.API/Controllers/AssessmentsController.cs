using EduPulse.API.Data;
using EduPulse.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EduPulse.API.Controllers
{
    [Authorize(Roles = "Teacher,Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AssessmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AssessmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("gradebook/{courseId}")]
        public async Task<IActionResult> GetGradebook(int courseId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound();

            return Ok(new
            {
                assessments = await _context.Assessments
                    .Where(a => a.CourseId == courseId)
                    .OrderBy(a => a.Date) // Ensures timeline order
                    .ToListAsync(),
                enrollments = await _context.Enrollments
                    .Where(e => e.CourseId == courseId)
                    .Include(e => e.Student)
                    .ToListAsync(),
                policy = course.GradingPolicy
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateAssessment([FromBody] Assessment assessment)
        {
            if (assessment == null) return BadRequest();

            // SAFETY FIX: If date is missing or set to 0001-01-01, set to NOW
            if (assessment.Date == DateTime.MinValue || assessment.Date.Year < 2000)
            {
                assessment.Date = DateTime.Now;
            }

            _context.Assessments.Add(assessment);
            await _context.SaveChangesAsync();
            return Ok(assessment);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssessment(int id)
        {
            var assessment = await _context.Assessments.FindAsync(id);
            if (assessment == null) return NotFound();

            // Also delete all grades associated with this assessment
            var relatedGrades = _context.Grades.Where(g => g.AssessmentId == id);
            _context.Grades.RemoveRange(relatedGrades);

            _context.Assessments.Remove(assessment);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("course/{courseId}/policy")]
        public async Task<IActionResult> UpdatePolicy(int courseId, [FromBody] dynamic body)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound();

            course.GradingPolicy = body.policy;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}