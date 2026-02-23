using System;
using System.Collections.Generic;

namespace EduPulse.API.DTOs
{
    // Used when the Teacher submits attendance for a class
    public class MarkAttendanceRequest
    {
        public int CourseId { get; set; }
        public DateTime Date { get; set; }
        public List<StudentAttendanceItem> Students { get; set; }
    }

    public class StudentAttendanceItem
    {
        public int StudentId { get; set; }
        public bool IsPresent { get; set; }
    }

    // Used to show the Student their progress
    public class AttendanceSummaryDto
    {
        public int TotalClasses { get; set; }
        public int AttendedClasses { get; set; }
        public double Percentage { get; set; }
        public int GradePoints { get; set; } // The score out of 10
    }
}