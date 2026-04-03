using System.ComponentModel.DataAnnotations;

namespace EduPulse.API.Models
{
    public class Department
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        // This is the secret key you mentioned for teachers
        [Required]
        public string TeacherVerificationKey { get; set; } = string.Empty;

        // Relationship: One Department has many Users
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}