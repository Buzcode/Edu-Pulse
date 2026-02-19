using EduPulse.API.Data;
// using EduPulse.API.Services; // ⚠️ Commented out because you haven't moved Services yet
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// -------------------- DATABASE --------------------
// This connects to the database defined in appsettings.json
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// -------------------- SERVICES --------------------
// ⚠️ REMOVED AttendanceService because it hasn't been copied yet.
// If your Auth/Courses logic is inside Controllers, you don't need to register anything here.

// -------------------- CONTROLLERS --------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// -------------------- CORS (Allow React) --------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.WithOrigins("http://localhost:5173") // Make sure this matches your React port
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

// -------------------- AUTHENTICATION --------------------
// This reads the JWT settings from appsettings.json
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            )
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// -------------------- STATIC FILES (Uploads) --------------------
// Ensures the "Uploads" folder exists for course materials
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/Uploads"
});

// -------------------- AUTO-MIGRATION --------------------
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var configuration = services.GetRequiredService<IConfiguration>();

        // This applies the migration to create the DB automatically
        context.Database.Migrate();

        // ⚠️ Commented out DbSeeder. 
        // Only uncomment this if you have copied "DbSeeder.cs" to your Data folder.
        // DbSeeder.Seed(context, configuration); 
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Error: {ex.Message}");
    }
}

// -------------------- MIDDLEWARE --------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();