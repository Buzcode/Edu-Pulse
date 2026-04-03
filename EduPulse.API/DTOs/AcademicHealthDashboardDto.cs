using System;
using System.Collections.Generic;

namespace EduPulse.API.DTOs
{
    public class AcademicHealthDashboardDto
    {
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public double CurrentPercentage { get; set; }
        public string AcademicHealthStatus { get; set; } = string.Empty;
        public List<PerformanceTimelinePoint> Timeline { get; set; } = new();
    }

    public class PerformanceTimelinePoint
    {
        public string EventName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public double? GradePercentage { get; set; }

        // REPLACED SoftSkillRating with the 3 distinct traits
        public double? DisciplineRating { get; set; }
        public double? ParticipationRating { get; set; }
        public double? CollaborationRating { get; set; }
    }
}