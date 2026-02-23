namespace EduPulse.API.DTOs
{
    public class GapAnalysisDto
    {
        public string AssessmentTitle { get; set; } = string.Empty;
        public double MyPercentage { get; set; }
        public double ClassAveragePercentage { get; set; }
    }
}