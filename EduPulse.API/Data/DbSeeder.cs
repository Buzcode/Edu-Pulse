using EduPulse.API.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;

namespace EduPulse.API.Data
{
    public static class DbSeeder
    {
        public static void Seed(ApplicationDbContext context, IConfiguration configuration)
        {
            // 1. Seed Department
            if (!context.Departments.Any())
            {
                context.Departments.Add(new Department { Name = "CSE", TeacherVerificationKey = "CSE123" });
                context.SaveChanges();
            }
            var dept = context.Departments.First();

            // 2. Seed Student
            if (!context.Users.Any(u => u.Role == UserRole.Student))
            {
                context.Users.Add(new User
                {
                    Name = "John Student",
                    Email = "student@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"),
                    Role = UserRole.Student,
                    IsVerified = true,
                    DepartmentId = dept.Id
                });
                context.SaveChanges();
            }
            var student = context.Users.First(u => u.Role == UserRole.Student);

            // 3. Seed Course & Enrollment
            if (!context.Courses.Any())
            {
                var course = new Course { Title = "Programming 101" };
                context.Courses.Add(course);
                context.SaveChanges();

                context.Enrollments.Add(new Enrollment { CourseId = course.Id, StudentId = student.Id });
                context.SaveChanges();
            }
            var enrollment = context.Enrollments.First();

            // 4. Seed Assessments & Grades (Independent Time Stream)
            if (!context.Assessments.Any())
            {
                var q1 = new Assessment { Title = "Quiz 1", Date = DateTime.Now.AddDays(-30), MaxMarks = 20, CourseId = enrollment.CourseId };
                var q2 = new Assessment { Title = "Midterm", Date = DateTime.Now.AddDays(-10), MaxMarks = 50, CourseId = enrollment.CourseId };

                context.Assessments.AddRange(q1, q2);
                context.SaveChanges();

                context.Grades.AddRange(
                    new Grade { AssessmentId = q1.Id, StudentId = student.Id, MarksObtained = 18, DateEntered = DateTime.Now.AddDays(-30) },
                    new Grade { AssessmentId = q2.Id, StudentId = student.Id, MarksObtained = 35, DateEntered = DateTime.Now.AddDays(-10) }
                );
                context.SaveChanges();
            }

            // 5. Seed Soft Skills (Independent Time Stream - Different Dates!)
         
        }
    }
}