using System.ComponentModel.DataAnnotations;

namespace EduPulse.API.DTOs
{
    public class CourseCreateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        [Required]
        public string Code { get; set; } = string.Empty;
        [Required]
        public int TargetDeptId { get; set; }
        [Required]
        [Range(1, 4)]
        public int Year { get; set; }
        [Required]
        [Range(1, 2)]
        public int Semester { get; set; }
    }
}