using EduPulse.API.Data;
using EduPulse.API.Models; // Ensure you have this namespace
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EduPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Requires Login
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment; // ✅ ADDED: Required for File Uploads

        public CoursesController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // =================================================================
        // 1. GET: Fetch courses based on role (User's Logic)
        // =================================================================
        [HttpGet]
        public async Task<IActionResult> GetMyCourses()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var roleClaim = User.FindFirst(ClaimTypes.Role);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            string role = roleClaim?.Value ?? "";

            // --- TEACHER LOGIC ---
            if (role == "Teacher")
            {
                // Ensure your Course model has TeacherId and TargetDept navigation
                var teacherCourses = await _context.Courses
                    .Where(c => c.TeacherId == userId)
                    .Include(c => c.TargetDept) // Ensure this relationship exists in DbContext
                    .Select(c => new
                    {
                        c.Id,
                        c.Title,
                        c.Code,
                        c.IsPublished,
                        DeptName = c.TargetDept != null ? c.TargetDept.Name : "N/A",
                        // Logic: Year 2 Sem 1 -> TargetSemester 3. (3+1)/2 = 2. 
                        Year = (c.TargetSemester + 1) / 2,
                        Semester = c.TargetSemester % 2 == 0 ? 2 : 1
                    })
                    .ToListAsync();

                return Ok(teacherCourses);
            }

            // --- STUDENT LOGIC ---
            if (role == "Student")
            {
                var studentCourses = await _context.Enrollments
                    .Where(e => e.StudentId == userId)
                    .Include(e => e.Course!).ThenInclude(c => c.TargetDept)
                    .Include(e => e.Course!.Teacher)
                    .Select(e => new
                    {
                        e.Course!.Id,
                        e.Course.Title,
                        e.Course.Code,
                        e.Course.IsPublished,
                        TeacherName = e.Course.Teacher != null ? e.Course.Teacher.Name : "Unknown",
                        DeptName = e.Course.TargetDept != null ? e.Course.TargetDept.Name : "N/A",
                        Year = (e.Course.TargetSemester + 1) / 2,
                        Semester = e.Course.TargetSemester % 2 == 0 ? 2 : 1,
                        e.Status
                    })
                    .ToListAsync();

                return Ok(studentCourses);
            }

            // --- ADMIN LOGIC ---
            if (role == "Admin")
            {
                // Ensure Admin can see all courses
                return Ok(await _context.Courses
                    .Include(c => c.TargetDept)
                    .Include(c => c.Teacher)
                    .Select(c => new
                    {
                        c.Id,
                        c.Title,
                        c.Code,
                        DeptName = c.TargetDept != null ? c.TargetDept.Name : "N/A",
                        TeacherName = c.Teacher != null ? c.Teacher.Name : "Unknown"
                    }).ToListAsync());
            }

            return Forbid();
        }

        // =================================================================
        // 2. POST: Create New Course (User's Logic)
        // =================================================================
        [HttpPost]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto input)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int teacherId = int.Parse(userIdClaim.Value);

            // Calculation: Year 2, Sem 1 => (2-1)*2 + 1 = 3
            int calculatedSemester = (input.Year - 1) * 2 + input.Semester;

            var course = new Course
            {
                Title = input.Title,
                Code = input.Code,
                TargetDeptId = input.TargetDeptId,
                TargetSemester = calculatedSemester,
                TeacherId = teacherId,
                IsPublished = true,
                GradingPolicy = "Best 2 of 3 Quizzes"
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Course created successfully", courseId = course.Id });
        }

        // =================================================================
        // 3. POST: Sync Batch (User's Logic)
        // =================================================================
        [HttpPost("sync/{courseId}")]
        public async Task<IActionResult> SyncBatch(int courseId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Course not found.");

            // Find students in the same Dept and Semester
            var targetStudents = await _context.Users
                .Where(u => u.Role == UserRole.Student &&
                            u.DepartmentId == course.TargetDeptId &&
                            u.CurrentSemester == course.TargetSemester) // Ensure User model has CurrentSemester
                .ToListAsync();

            int enrolledCount = 0;

            foreach (var student in targetStudents)
            {
                bool exists = await _context.Enrollments
                    .AnyAsync(e => e.CourseId == courseId && e.StudentId == student.Id);

                if (!exists)
                {
                    _context.Enrollments.Add(new Enrollment
                    {
                        CourseId = courseId,
                        StudentId = student.Id,
                        Status = "Regular",
                        EnrolledAt = DateTime.Now // Ensure Enrollment model has this field
                    });
                    enrolledCount++;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Successfully synced! {enrolledCount} students enrolled." });
        }

        // =================================================================
        // 4. GET: Enrolled students (User's Logic)
        // =================================================================
        [HttpGet("{id}/students")]
        public async Task<IActionResult> GetStudentsInCourse(int id)
        {
            var students = await _context.Enrollments
                .Where(e => e.CourseId == id)
                .Include(e => e.Student)
                .Select(e => new {
                    EnrollmentId = e.Id,
                    StudentId = e.StudentId,
                    Name = e.Student.Name,
                    Email = e.Student.Email,
                    Status = e.Status.ToString()
                })
                .ToListAsync();

            return Ok(students);
        }

        // =================================================================
        // ✅ 5. GET: Fetch Course Materials (RESTORED)
        // This fixes the 404 on the Course Stream page
        // =================================================================
        [HttpGet("{id}/materials")]
        public async Task<ActionResult<IEnumerable<CourseMaterial>>> GetMaterials(int id)
        {
            var materials = await _context.CourseMaterials
                .Where(m => m.CourseId == id)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(materials);
        }

        // =================================================================
        // ✅ 6. POST: Upload Material (RESTORED)
        // This fixes the Upload Button functionality
        // =================================================================
        [HttpPost("{id}/upload")]
        public async Task<IActionResult> UploadMaterial(int id, [FromForm] MaterialUploadDto uploadDto)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound("Course not found");

            string fileUrl = "";
            string fileName = "";

            if (uploadDto.File != null && uploadDto.File.Length > 0)
            {
                string uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                fileName = uploadDto.File.FileName;
                string uniqueFileName = Guid.NewGuid().ToString() + "_" + fileName;
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await uploadDto.File.CopyToAsync(stream);
                }

                fileUrl = $"/Uploads/{uniqueFileName}";
            }

            var material = new CourseMaterial
            {
                CourseId = id,
                Title = uploadDto.Title,
                Description = uploadDto.Description,
                FileUrl = fileUrl,
                FileName = fileName,
                CreatedAt = DateTime.Now
            };

            _context.CourseMaterials.Add(material);
            await _context.SaveChangesAsync();

            return Ok(material);
        }

        // =================================================================
        // 7. POST: Toggle Publish status (User's Logic)
        // =================================================================
        [HttpPost("{id}/publish")]
        public async Task<IActionResult> TogglePublish(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            course.IsPublished = !course.IsPublished;
            await _context.SaveChangesAsync();
            return Ok(new { isPublished = course.IsPublished });
        }

        // =================================================================
        // 8. POST: Manually enroll a student (User's Logic)
        // =================================================================
        [HttpPost("{courseId}/enroll-manual")]
        public async Task<IActionResult> EnrollManual(int courseId, [FromBody] string studentEmail)
        {
            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == studentEmail && u.Role == UserRole.Student);

            if (student == null) return NotFound("Student not found.");

            bool exists = await _context.Enrollments.AnyAsync(e => e.CourseId == courseId && e.StudentId == student.Id);
            if (exists) return BadRequest("Student already enrolled.");

            _context.Enrollments.Add(new Enrollment
            {
                CourseId = courseId,
                StudentId = student.Id,
                Status = "Retake" // Ensure Status is a string or Enum in your model
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"{student.Name} enrolled manually." });
        }
    }

    // =================================================================
    // DTOs
    // =================================================================
    public class CreateCourseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int TargetDeptId { get; set; }
        public int Year { get; set; }
        public int Semester { get; set; }
    }

    public class MaterialUploadDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public IFormFile? File { get; set; }
    }
}