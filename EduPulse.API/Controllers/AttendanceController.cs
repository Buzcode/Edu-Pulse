using EduPulse.API.DTOs;
using EduPulse.API.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace EduPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        // POST: api/Attendance/mark
        [HttpPost("mark")]
        public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                await _attendanceService.MarkAttendanceAsync(request);
                return Ok(new { Message = "Attendance marked successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Attendance/summary/{courseId}/{studentId}
        [HttpGet("summary/{courseId}/{studentId}")]
        public async Task<IActionResult> GetAttendanceSummary(int courseId, int studentId)
        {
            try
            {
                var summary = await _attendanceService.CalculateStudentAttendanceAsync(courseId, studentId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Attendance/history/{courseId}
        [HttpGet("history/{courseId}")]
        public async Task<IActionResult> GetCourseHistory(int courseId)
        {
            try
            {
                var history = await _attendanceService.GetCourseAttendanceHistoryAsync(courseId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // ✅ NEW: GET Existing records for a specific date (For Editing)
        [HttpGet("course/{courseId}/date/{date}")]
        public async Task<IActionResult> GetByDate(int courseId, DateTime date)
        {
            var records = await _attendanceService.GetAttendanceByDateAsync(courseId, date);
            return Ok(records);
        }

        // ✅ NEW: DELETE all records for a specific date (For Deleting)
        [HttpDelete("course/{courseId}/date/{date}")]
        public async Task<IActionResult> DeleteByDate(int courseId, DateTime date)
        {
            await _attendanceService.DeleteAttendanceByDateAsync(courseId, date);
            return Ok(new { message = "Attendance for this date deleted." });
        }
    }
}