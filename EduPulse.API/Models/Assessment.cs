using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System;

namespace EduPulse.API.Models
{
    public enum AssessmentType
    {
        Attendance = 0,
        Quiz = 1,
        // We skip 2 (which was Midterm) to keep FinalExam at 3
        FinalExam = 3,
        Assignment = 4,
        Clearance = 5, // NEW
        Carry = 6      // NEW
    }

    public class Assessment
    {
        public int Id { get; set; }
        [Required] public string Title { get; set; } = string.Empty;
        public AssessmentType Type { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public double MaxMarks { get; set; }
        public double Weightage { get; set; }
        public int CourseId { get; set; }

        [JsonIgnore] public Course? Course { get; set; }
        [JsonIgnore] public ICollection<Grade>? Grades { get; set; } = new List<Grade>();
    }
}