using System.ComponentModel.DataAnnotations;

namespace EduPulse.API.Models
{
    public class CourseMaterial
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course? Course { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; } // For Announcements

        public string? FileName { get; set; }   // e.g., "lecture1.pdf"
        public string? FileUrl { get; set; }    // The path on the server

        public string MaterialType { get; set; } = "Announcement"; // "Announcement" or "File"

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}