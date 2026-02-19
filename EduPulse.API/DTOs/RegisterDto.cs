using System.ComponentModel.DataAnnotations;

namespace EduPulse.API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "Student"; // "Student" or "Teacher"

        [Required]
        public int DepartmentId { get; set; }

        // Optional fields based on role
        [Range(1, 4, ErrorMessage = "Year must be between 1 and 4.")]
        public int? Year { get; set; }

        [Range(1, 2, ErrorMessage = "Semester must be between 1 and 2.")]
        public int? Semester { get; set; }
        public string? VerificationKey { get; set; } // Only for Teachers
    }
}