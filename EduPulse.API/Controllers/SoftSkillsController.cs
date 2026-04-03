using EduPulse.API.Data;
using EduPulse.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SoftSkillsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SoftSkillsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/SoftSkills/upsert
        [HttpPost("upsert")]
        public async Task<IActionResult> UpsertSoftSkill([FromBody] SoftSkillRequest request)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == request.StudentId && e.CourseId == request.CourseId);

            if (enrollment == null) return NotFound(new { message = "Student not enrolled." });

            var today = DateTime.Now.Date;
            var existingToday = await _context.SoftSkills
                .FirstOrDefaultAsync(s => s.EnrollmentId == enrollment.Id && s.LastUpdated.Date == today);

            if (existingToday == null)
            {
                _context.SoftSkills.Add(new SoftSkill
                {
                    EnrollmentId = enrollment.Id,
                    Discipline = request.Discipline,
                    Participation = request.Participation,
                    Collaboration = request.Collaboration,
                    LastUpdated = DateTime.Now
                });
            }
            else
            {
                existingToday.Discipline = request.Discipline;
                existingToday.Participation = request.Participation;
                existingToday.Collaboration = request.Collaboration;
                existingToday.LastUpdated = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Behavior recorded!" });
        }

        // ✅ FIXED: Now accepts a single EnrollmentId (matches your Frontend)
        // GET: api/SoftSkills/enrollment/{enrollmentId}
        [HttpGet("enrollment/{enrollmentId}")]
        public async Task<IActionResult> GetLatestRatingByEnrollment(int enrollmentId)
        {
            // Find the most recent soft skill entry for this enrollment ID
            var skill = await _context.SoftSkills
                .Where(s => s.EnrollmentId == enrollmentId)
                .OrderByDescending(s => s.LastUpdated)
                .FirstOrDefaultAsync();

            // If no rating exists yet, return empty defaults so the frontend doesn't crash
            if (skill == null)
            {
                return Ok(new SoftSkill
                {
                    EnrollmentId = enrollmentId,
                    Discipline = 0,
                    Participation = 0,
                    Collaboration = 0
                });
            }

            return Ok(skill);
        }

        // (Optional) Keep this if you use it elsewhere, otherwise it can be removed
        [HttpGet("enrollment/{studentId}/{courseId}")]
        public async Task<IActionResult> GetLatestRating(int studentId, int courseId)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

            if (enrollment == null) return NotFound();

            var skill = await _context.SoftSkills
                .Where(s => s.EnrollmentId == enrollment.Id)
                .OrderByDescending(s => s.LastUpdated)
                .FirstOrDefaultAsync();

            return Ok(skill);
        }
    }

    public class SoftSkillRequest
    {
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public int Discipline { get; set; }
        public int Participation { get; set; }
        public int Collaboration { get; set; }
    }
}