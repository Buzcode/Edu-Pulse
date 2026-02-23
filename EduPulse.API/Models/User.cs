using System.ComponentModel.DataAnnotations;

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
        public Department? Department { get; set; }

        public ICollection<Grade> Grades { get; set; } = new List<Grade>();
    }
}
