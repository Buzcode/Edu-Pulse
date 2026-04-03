using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; // Required for JsonIgnore

namespace EduPulse.API.Models
{
    public class Grade
    {
        public int Id { get; set; }

        public double MarksObtained { get; set; }
        public DateTime DateEntered { get; set; } = DateTime.Now;

        // Foreign Keys
        public int AssessmentId { get; set; }
        public int StudentId { get; set; }

        // ✅ CRITICAL FIX: Add [JsonIgnore] here to stop the infinite loop
        [JsonIgnore]
        [ForeignKey("AssessmentId")]
        public Assessment? Assessment { get; set; }

        [JsonIgnore]
        [ForeignKey("StudentId")]
        public User? Student { get; set; }
    }
}