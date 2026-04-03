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

        // Ratings (1-5 stars)
        [Range(1, 5)]
        public int Discipline { get; set; } = 1;

        [Range(1, 5)]
        public int Participation { get; set; } = 1;

        [Range(1, 5)]
        public int Collaboration { get; set; } = 1;

        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
}