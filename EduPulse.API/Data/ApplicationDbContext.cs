using EduPulse.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EduPulse.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<CourseMaterial> CourseMaterials { get; set; }
        public DbSet<Assessment> Assessments { get; set; }
        public DbSet<Grade> Grades { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ================= Department ↔ Users =================
            modelBuilder.Entity<Department>()
                .HasMany(d => d.Users)
                .WithOne(u => u.Department)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ================= Enrollment Relations =================
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.NoAction);

           
            // This works perfectly with the new DbSeeder logic
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "CSE", TeacherVerificationKey = "CSE-KEY" },
                new Department { Id = 2, Name = "EEE", TeacherVerificationKey = "EEE-KEY" },
                new Department { Id = 3, Name = "BBA", TeacherVerificationKey = "BBA-KEY" },
                new Department { Id = 4, Name = "English", TeacherVerificationKey = "ENG-KEY" }
            );
        }
    }
}