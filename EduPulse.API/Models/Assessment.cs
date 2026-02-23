using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System;

namespace EduPulse.API.Models
{
    public enum AssessmentType { Attendance, Quiz, Midterm, FinalExam, Assignment }

    public class Assessment
    {
        public int Id { get; set; }
        [Required] public string Title { get; set; } = string.Empty;
        public AssessmentType Type { get; set; }
        public DateTime Date { get; set; } = DateTime.Now; // Used for X-Axis
        public double MaxMarks { get; set; }
        public double Weightage { get; set; }
        public int CourseId { get; set; }

        [JsonIgnore] public Course? Course { get; set; }
        [JsonIgnore] public ICollection<Grade>? Grades { get; set; } = new List<Grade>();
    }
}