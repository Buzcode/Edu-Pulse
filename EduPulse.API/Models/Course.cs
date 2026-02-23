using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduPulse.API.Models
{
    public class Course
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Code { get; set; } = string.Empty;

        // ✅ FIX: Must match User.Id (int)
        // Nullable allows creating a Course before assigning a Teacher
        public int? TeacherId { get; set; }

        [ForeignKey(nameof(TeacherId))]
        public User? Teacher { get; set; }

        // --- BATCH SYNC TARGETS ---
        public int TargetDeptId { get; set; }
        public Department? TargetDept { get; set; }

        [Range(1, 8)]
        public int TargetSemester { get; set; }

        // --- GRADING SETTINGS ---
        public string GradingPolicy { get; set; } = "Best 2 of 3 Quizzes";

        // --- PUBLISHING STATUS ---
        public bool IsPublished { get; set; } = false;

        // --- NAVIGATION PROPERTIES ---
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    }
}
