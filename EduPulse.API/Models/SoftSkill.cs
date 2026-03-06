using System.ComponentModel.DataAnnotations;

namespace EduPulse.API.Models
{
    public class SoftSkill
    {
        [Key]
        public int Id { get; set; }

        // Link to the existing Enrollment (Student + Course)
        public int EnrollmentId { get; set; }
        public Enrollment? Enrollment { get; set; }

        // ✅ NEW: The date this soft skill rating applies to
        // Defaults to Today so we always have a value
        public DateTime Date { get; set; } = DateTime.Today;

        // Ratings (1-5 stars)
        // ✅ CHANGED: Default values are now 4, as per your "Daily Pulse" requirements.
        [Range(1, 5)]
        public int Discipline { get; set; } = 4;

        [Range(1, 5)]
        public int Participation { get; set; } = 4;

        [Range(1, 5)]
        public int Collaboration { get; set; } = 4;

        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
}