namespace EduPulse.API.Models
{
    public class Enrollment
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course? Course { get; set; }

        // ✅ MUST match User.Id (int)
        public int StudentId { get; set; }
        public User? Student { get; set; }

        // NEW: 0 = Ongoing, 1 = Completed
        public bool IsCompleted { get; set; } = false;
        public string Status{ get; set; } = "Regular"; // Regular, Retake, Carry
        public DateTime EnrolledAt { get; set; } = DateTime.Now;
    }
}
