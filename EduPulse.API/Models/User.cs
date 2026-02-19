using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduPulse.API.Models
{
    public enum UserRole
    {
        Admin,
        Teacher,
        Student
    }

    public class User
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public UserRole Role { get; set; }

        public bool IsVerified { get; set; }

        public int? CurrentSemester { get; set; }

        public int DepartmentId { get; set; }

        [ForeignKey("DepartmentId")]
        public Department? Department { get; set; }

        // REMOVED: Grades list (causes error because Grade.cs is not here)
    }
}