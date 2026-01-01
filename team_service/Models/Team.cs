namespace team_service.Models;
using System.ComponentModel.DataAnnotations;

public class Team {
    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int LeaderId { get; set; }
    public DateOnly DateOfCreation { get; set; } = DateOnly.FromDateTime(DateTime.Now);
    public List<TeamMember> Members { get; set; } = [];
}