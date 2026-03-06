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

        // 1. GET HISTORY (For Charting)
        [HttpGet("history/{courseId}/{studentId}")]
        public async Task<IActionResult> GetStudentHistory(int courseId, int studentId)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId);

            if (enrollment == null) return NotFound("Student not enrolled.");

            var history = await _context.SoftSkills
                .Where(s => s.EnrollmentId == enrollment.Id)
                .OrderBy(s => s.Date)
                .Select(s => new
                {
                    Date = s.Date.ToString("yyyy-MM-dd"),
                    s.Discipline,
                    s.Participation,
                    s.Collaboration
                })
                .ToListAsync();

            return Ok(history);
        }

        // 2. UPSERT (The Daily Pulse Override)
        [HttpPost("upsert")]
        public async Task<IActionResult> UpsertSoftSkill([FromBody] SoftSkillRequest request)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == request.StudentId && e.CourseId == request.CourseId);

            if (enrollment == null) return NotFound(new { message = "Student not enrolled." });

            // ✅ CRITICAL FIX: Use the Date provided by the UI, not DateTime.Today
            var targetDate = request.Date.Date;

            var existingRecord = await _context.SoftSkills
                .FirstOrDefaultAsync(s => s.EnrollmentId == enrollment.Id && s.Date == targetDate);

            if (existingRecord == null)
            {
                _context.SoftSkills.Add(new SoftSkill
                {
                    EnrollmentId = enrollment.Id,
                    Date = targetDate,
                    Discipline = request.Discipline,
                    Participation = request.Participation,
                    Collaboration = request.Collaboration,
                    LastUpdated = DateTime.Now
                });
            }
            else
            {
                existingRecord.Discipline = request.Discipline;
                existingRecord.Participation = request.Participation;
                existingRecord.Collaboration = request.Collaboration;
                existingRecord.LastUpdated = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Behavior recorded for " + targetDate.ToShortDateString() });
        }

        // 3. GET LATEST (For the Teacher Modal)
        [HttpGet("enrollment/{studentId}/{courseId}")]
        public async Task<IActionResult> GetLatestRating(int studentId, int courseId)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

            if (enrollment == null) return NotFound();

            var skill = await _context.SoftSkills
                .Where(s => s.EnrollmentId == enrollment.Id)
                .OrderByDescending(s => s.Date)
                .FirstOrDefaultAsync();

            return Ok(skill);
        }
    }

    public class SoftSkillRequest
    {
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public DateTime Date { get; set; } // ✅ Now correctly handled
        public int Discipline { get; set; }
        public int Participation { get; set; }
        public int Collaboration { get; set; }
    }
}