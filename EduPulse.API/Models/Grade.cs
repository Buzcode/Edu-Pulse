using System.Text.Json.Serialization;

namespace EduPulse.API.Models
{
    public class Grade
    {
        public int Id { get; set; }
        public int AssessmentId { get; set; }

        [JsonIgnore]
        public Assessment? Assessment { get; set; }

        // ✅ FIX: Changed to int to match User.Id
        public int StudentId { get; set; }

        [JsonIgnore]
        public User? Student { get; set; }

        public double MarksObtained { get; set; }
        public DateTime DateEntered { get; set; } = DateTime.Now;
    }
}