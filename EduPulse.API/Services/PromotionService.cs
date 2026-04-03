using EduPulse.API.Data;
using EduPulse.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EduPulse.API.Services
{
    public class PromotionService
    {
        private readonly ApplicationDbContext _context;

        public PromotionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CourseResult> CalculateCourseResult(int enrollmentId)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.Id == enrollmentId);

            if (enrollment == null) return null;

            // 1. Get all grades for this specific enrollment
            var grades = await _context.Grades
                .Include(g => g.Assessment)
                .Where(g => g.StudentId == enrollment.StudentId && g.Assessment.CourseId == enrollment.CourseId)
                .ToListAsync();

            // 2. Separate Grades by Type
            var carryGrade = grades.FirstOrDefault(g => (int)g.Assessment.Type == 6); // Carry
            var clearanceGrade = grades.FirstOrDefault(g => (int)g.Assessment.Type == 5); // Clearance
            var finalGrade = grades.FirstOrDefault(g => (int)g.Assessment.Type == 3); // FinalExam
            var attendanceGrade = grades.FirstOrDefault(g => (int)g.Assessment.Type == 0); // Attendance
            var quizGrades = grades.Where(g => (int)g.Assessment.Type == 1).OrderByDescending(g => g.MarksObtained).ToList();

            double totalMarks = 0;
            double caTotal = 0;
            double examMarks = 0;

            // --- LOGIC PRIORITY 1: CARRY COURSE ---
            if (carryGrade != null)
            {
                // Math: (Marks / 70) * 100. We ignore Quizzes and Attendance.
                totalMarks = (carryGrade.MarksObtained / 70.0) * 100.0;
                caTotal = 0;
                examMarks = carryGrade.MarksObtained;
            }
            // --- LOGIC PRIORITY 2: CLEARANCE OR REGULAR ---
            else
            {
                double quizScore = 0;
                if (quizGrades.Any())
                {
                    int takeCount = Math.Max(1, quizGrades.Count - 1);
                    quizScore = quizGrades.Take(takeCount).Average(g => g.MarksObtained);
                }
                double attendanceScore = attendanceGrade?.MarksObtained ?? 0;
                caTotal = quizScore + attendanceScore;

                if (clearanceGrade != null)
                {
                    examMarks = clearanceGrade.MarksObtained;
                    totalMarks = caTotal + examMarks;
                }
                else
                {
                    examMarks = finalGrade?.MarksObtained ?? 0;
                    totalMarks = caTotal + examMarks;
                }
            }

            totalMarks = Math.Min(100, totalMarks);
            string label = "Regular";
            if (carryGrade != null) label = "Carry";
            else if (clearanceGrade != null) label = "Clearance";
            return new CourseResult
            {
                EnrollmentId = enrollmentId,
                ContinuousAssessmentMarks = caTotal,
                FinalExamMarks = examMarks,
                TotalMarks = totalMarks,
                IsPassed = totalMarks >= 40,
                IsActiveCarryCourse = totalMarks < 40,
                AttemptType = label,
                ResultPublishedAt = DateTime.Now
            };
        }
    }
}