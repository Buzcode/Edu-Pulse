using EduPulse.API.Data;
using EduPulse.API.DTOs;
using EduPulse.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EduPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email is already registered.");

            if (dto.Role == "Student")
            {
                if (!dto.Email.EndsWith("@aust.edu"))
                    return BadRequest("Students must use an @aust.edu email.");

                if (!dto.Year.HasValue || !dto.Semester.HasValue)
                    return BadRequest("Year & Semester required.");
            }

            var dept = await _context.Departments.FindAsync(dto.DepartmentId);
            if (dept == null) return BadRequest("Invalid department.");

            bool isVerified = dto.Role == "Student";

            if (dto.Role == "Teacher" && dept.TeacherVerificationKey != dto.VerificationKey)
                return BadRequest("Invalid verification key.");

            int? flatSemester = dto.Role == "Student"
                ? ((dto.Year!.Value - 1) * 2) + dto.Semester!.Value
                : null;

            var user = new User
            {
                Email = dto.Email,
                Name = dto.Name,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = Enum.Parse<UserRole>(dto.Role),
                DepartmentId = dto.DepartmentId,
                CurrentSemester = flatSemester,
                IsVerified = isVerified
            };


            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful", isVerified });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized("Invalid credentials.");

            if (!user.IsVerified)
                return BadRequest("Account pending admin approval.");

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user.Id,
                user.Name,
                user.Email,
                Role = user.Role.ToString(),
                Department = user.Department!.Name,

                Year = user.CurrentSemester.HasValue
                    ? (int?)((user.CurrentSemester.Value + 1) / 2)
                    : null,

                Semester = user.CurrentSemester.HasValue
                    ? (int?)(user.CurrentSemester.Value % 2 == 0 ? 2 : 1)
                    : null
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("pending-teachers")]
        public async Task<IActionResult> PendingTeachers()
        {
            return Ok(await _context.Users
                .Where(u => u.Role == UserRole.Teacher && !u.IsVerified)
                .Select(u => new { u.Id, u.Name, u.Email })
                .ToListAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("approve-teacher/{id}")]
        public async Task<IActionResult> ApproveTeacher(string id)
        {
            // Convert the string id to an integer
            if (!int.TryParse(id, out int teacherId))
            {
                return BadRequest("Invalid Teacher ID format.");
            }

            // Use the integer teacherId here
            var teacher = await _context.Users.FindAsync(teacherId);

            if (teacher == null) return NotFound("Teacher not found.");

            teacher.IsVerified = true;
            await _context.SaveChangesAsync();

            return Ok("Teacher approved.");
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Role, user.Role.ToString()),
        new Claim(ClaimTypes.Email, user.Email!)
    };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

    }
}
