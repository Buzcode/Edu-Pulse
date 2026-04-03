using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduPulse.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsArchivedToCourse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Courses");
        }
    }
}
