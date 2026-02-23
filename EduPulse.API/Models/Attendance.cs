using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduPulse.API.Models
{
    public class Attendance
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public bool IsPresent { get; set; }

        // --- Relationships ---

        [Required]
        [ForeignKey("Course")]
        public int CourseId { get; set; }

        // The '?' eliminates the CS8618 warning by making it nullable
        public virtual Course? Course { get; set; }

        [Required]
        [ForeignKey("Student")]
        // CHANGED: string -> int (Assuming your User table uses int IDs)
        public int StudentId { get; set; }

        // CHANGED: ApplicationUser -> User
        public virtual User? Student { get; set; }
    }
}