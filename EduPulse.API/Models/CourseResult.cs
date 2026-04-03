using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduPulse.API.Models
{
    public class CourseResult
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EnrollmentId { get; set; }

        [ForeignKey("EnrollmentId")]
        public Enrollment Enrollment { get; set; }

        // Marks Breakdown
        public double ContinuousAssessmentMarks { get; set; } // Quizzes + Attendance (Max 30)
        public double FinalExamMarks { get; set; } // Final Exam (Max 70)
        public double TotalMarks { get; set; } // Sum of above (Max 100)

        // Status
        public bool IsPassed { get; set; }

        // This marks if the course is currently a "Carry" that needs to be cleared
        public bool IsActiveCarryCourse { get; set; }
        public string AttemptType { get; set; } = "Regular";
        public DateTime ResultPublishedAt { get; set; } = DateTime.Now;
    }
}